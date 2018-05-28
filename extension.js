const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const moment =require('moment');
const {
    spawn
} = require('child_process');
const request = require('request')


function activate(context) {
    // 从剪贴板复制图片
    let disposable = vscode.commands.registerCommand('extension.mz-upload-image', function () {
        initImage();
    });
    context.subscriptions.push(disposable);
    // 从填写路径获取文件
    disposable = vscode.commands.registerCommand('extension.mz-upload-file', function () {
        initFile();
    });
    context.subscriptions.push(disposable);
}

exports.activate = activate;

// 注销插件
function deactivate() {}
exports.deactivate = deactivate;

function initFile(){
    let editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let fileUri = editor.document.uri;
    if (!fileUri) return;

    if (fileUri.scheme === 'untitled') {
        vscode.window.showInformationMessage('Before paste image, you need to save current edit file first.');
        return;
    }

    let selection = editor.selection;
    let selectText = editor.document.getText(selection);

    if (selectText && !/^[\w\-.]+$/.test(selectText)) {
        vscode.window.showInformationMessage('Your selection is not a valid file name!');
        return;
    }
    let config = vscode.workspace.getConfiguration('mz-upload');
    const mdFilePath = editor.document.fileName;
    inputPath(config,mdFilePath, editor ); 

    // 从windows剪贴板获取文件地址
     /* const scriptPath = path.join(__dirname, './file.ps1');
        const powershell = spawn('powershell', [
        '-noprofile',
        '-noninteractive',
        '-nologo',
        '-sta',
        '-executionpolicy', 'unrestricted',
        '-windowstyle', 'hidden',
        '-file', scriptPath
    ]);
    powershell.stderr.on('data',function(data){
        console.log("脚本执行错误=="+new Buffer(data+"","utf-8"));
    })
    powershell.stdout.on('data', function (data) {
        if(data==""){
            savePath(config, data, mdFilePath, editor);
        }else{
            inputPath(config,mdFilePath, editor ); 
        }
    }); */
}

function inputPath(config,mdFilePath, editor ){
    vscode.window.showInputBox({
        placeHolder: '请输入本地文件绝对路径'
    }).then(val => {
        if (val) {
            fs.exists(val, flag => {
                if (flag) {
                    savePath(config, val, mdFilePath, editor);
                } else {
                    vscode.window.showErrorMessage("所选路径文件不存在");
                    return;
                }
            })
        }
    })
}

function initImage() {
    // 获取当前编辑文件
    let editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let fileUri = editor.document.uri;
    if (!fileUri) return;

    if (fileUri.scheme === 'untitled') {
        vscode.window.showInformationMessage('Before paste image, you need to save current edit file first.');
        return;
    }

    let selection = editor.selection;
    let selectText = editor.document.getText(selection);

    if (selectText && !/^[\w\-.]+$/.test(selectText)) {
        vscode.window.showInformationMessage('Your selection is not a valid file name!');
        return;
    }
    let config = vscode.workspace.getConfiguration('mz-upload');
    let localPath = config.localPath;
    if (localPath && (localPath.length !== localPath.trim().length)) {
        vscode.window.showErrorMessage('The specified path is invalid. "' + localPath + '"');
        return;
    }

    let filePath = fileUri.fsPath;
    let imagePath = getImagePath(filePath, selectText, localPath);
    const mdFilePath = editor.document.fileName;
   
   createImageDirWithImagePath(imagePath).then(imagePath => {
        saveClipboardImageToFileAndGetPath(imagePath, (imagePath) => {
            if (!imagePath) return;
            if (imagePath === 'no image') {
                vscode.window.showErrorMessage('There is not a image in clipboard.');
                return;
            } 
            savePath(config, imagePath, mdFilePath, editor);
        });
    }).catch(err => {
        vscode.window.showErrorMessage('Failed make folder:' + err);
        return;
    });
}

function getImagePath(filePath, selectText, localPath) {
    // 图片名称
    let imageFileName = '';
    if (!selectText) {
        imageFileName = moment().format("Y-MM-DD-HH-mm-ss") + '.png';
    } else {
        imageFileName = selectText + '.png';
    }

    // 图片本地保存路径
    let folderPath = path.dirname(filePath);
    let imagePath = '';
    if (path.isAbsolute(localPath)) {
        imagePath = path.join(localPath, imageFileName);
    } else {
        imagePath = path.join(folderPath, localPath, imageFileName);
    }

    return imagePath;
}

function createImageDirWithImagePath(imagePath) {
    return new Promise((resolve, reject) => {
        let imageDir = path.dirname(imagePath);
        fs.exists(imageDir, (exists) => {
            if (exists) {
                resolve(imagePath);
                return;
            }
            fs.mkdir(imageDir, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(imagePath);
            });
        });
    });
}


function saveClipboardImageToFileAndGetPath(imagePath, cb) {
    if (!imagePath) return;
    let platform = process.platform;
    if (platform.indexOf("win") > -1) {
        // Windows
        const scriptPath = path.join(__dirname, './image.ps1');
        const powershell = spawn('powershell', [
            '-noprofile',
            '-noninteractive',
            '-nologo',
            '-sta',
            '-executionpolicy', 'unrestricted',
            '-windowstyle', 'hidden',
            '-file', scriptPath,
            imagePath
        ]);
        powershell.on('exit', function () {
        });
        powershell.stdout.on('data', function (data) {
            cb(data.toString().trim());
        });
    } else {
        vscode.window.showErrorMessage("暂时只支持windows系统");
    }
}

//C:\Users\v-yaoligang\Desktop\assets\2018-05-23-14-34-27.png
// 上传至gitbook静态站点
function mzUpload(config, file, mdFile) {
    const domain = config.domain;
    const remotePath = config.remotePath;

    let localFile = file
    if (/^".+"$/.test(localFile)) {
        localFile = file.substring(1, file.length - 1)
    }

    //上传后保存的文件名
    const saveFileName = moment().format("Y-MM-DD-HH-mm-ss") + path.extname(file);
    // 上传文件至meizu-itd-gitbook
    return new Promise((resolve, reject) => {
        let stream = fs.createReadStream(localFile);
        if (stream) {
            let formData = {
                type: "image",
                media: stream,
                fileName: saveFileName
            }
            request.post({
                    url: domain,
                    formData: formData
                },
                (err, res, body) => {
                    if (err) {
                        reject(err)
                    } else {
                        const result = JSON.parse(body);
                        if (result.code == 200) {
                            resolve({
                                name: saveFileName,
                                url: remotePath + saveFileName
                            })
                        } else {
                            reject(result.msg)
                        }
                    }
                }

            )
        }
    })
}

// 在md文件中保存远程路径
function savePath(config, imagePath, mdFilePath, editor) {
    mzUpload(config, imagePath, mdFilePath).then(({
        name,
        url
    }) => {
        vscode.window.showInformationMessage('upload to oss sucess');
        const fileExt = path.extname(imagePath);
        let postText = "";
        if(fileExt=="png"||fileExt=="gif"||fileExt=="bmp"||fileExt=="jpeg"){
            postText = `![${name}](${url})`;
        }else{
            postText = `[${name}](${url})`;
        }
        
        editor.edit(textEditorEdit => {
            textEditorEdit.insert(editor.selection.active, postText)
        });
    }).catch((err) => {
        vscode.window.showErrorMessage('Upload error:' + err);
    });
}

