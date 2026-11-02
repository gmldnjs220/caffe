$projectRoot=Split-Path $PSScriptRoot -Parent
$pidPath=Join-Path $projectRoot '.local\tomcat\prototype.pid'
if(Test-Path $pidPath){
 $prototypeId=[int](Get-Content $pidPath)
 $proc=Get-Process -Id $prototypeId -ErrorAction SilentlyContinue
 if($proc -and $proc.ProcessName -eq 'java'){ Stop-Process -Id $prototypeId }
 Remove-Item -LiteralPath $pidPath
}
