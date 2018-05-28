$filepath=""

Add-Type -Assembly PresentationCore
if([System.Windows.Clipboard]::ContainsImage()){
    $filepath =  [System.Environment]::Get-Clipboard()
}elseif([System.Windows.Clipboard]::ContainsFileDropList()){
    $filepath = [System.Environment]::Get-Clipboard()
   <#  if(!(Get-Item $filepath) -is [IO.fileinfo]){
        $filepath=""
    } #>
}else{
    $filepath=""
}

$filepath