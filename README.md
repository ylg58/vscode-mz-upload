# mz-upload 0.0.3
##对本插件二次开发前置条件 
-------------------- 
下载本项目 npm install
npm install vsce -g
打包成插件 vsce package  
ctr+shift+D可进行插件调试并且可以断点调试
----------------------
vscode插件 md文件编辑时便捷的进行图片和文件的应用  
上传图片或者文件至内网服务器，并且在md文件中返回可访问的地址  
自定义设置在vscode设置中修好以下三个配置选项  

        "mz-upload.remotePath": {
          "type": "string",
          "default": "https://oss.meizu.com/gitbook/",
          "description": "生成的远程地址的前缀"
        },
        "mz-upload.domain": {
          "type": "string",
          "default": "http://itd-gitbook.meizu.com/upload",
          "description": "内网映射的域名或者ip地址"
        },
        "mz-upload.localPath": {
          "type": "string",
          "default": "./assets",
          "description": "文件本地保存位置"
        } 
-----------------------------------
如果想尝试直接从剪贴板上获取文件  
可使用powershell语法编辑修改file.ps1  
并且在extension.js中 解开相应代码  



