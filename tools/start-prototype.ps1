param([int]$Port=8061)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$tomcatHome='C:\Program Files\Apache Software Foundation\Tomcat 10.1'
$runtime=Join-Path $projectRoot '.local\tomcat'
$webRoot=Join-Path $projectRoot 'Cafesite_OneBottle\src\main\webapp'
if (!(Test-Path (Join-Path $webRoot 'WEB-INF\db.properties')) -and !$env:ONEBOTTLE_DB_URL) { throw 'WEB-INF/db.properties.example을 복사하여 db.properties에 DB 접속 정보를 설정하세요.' }
New-Item -ItemType Directory -Force "$runtime\conf","$runtime\logs","$runtime\temp","$runtime\work","$runtime\webapps" | Out-Null
Copy-Item "$tomcatHome\conf\*" "$runtime\conf" -Force
$docBase=[System.Security.SecurityElement]::Escape($webRoot)
@"
<?xml version="1.0" encoding="UTF-8"?>
<Server port="-1"><Service name="Catalina"><Connector port="$Port" address="127.0.0.1" protocol="HTTP/1.1" connectionTimeout="20000" URIEncoding="UTF-8"/><Engine name="Catalina" defaultHost="localhost"><Host name="localhost" appBase="webapps" autoDeploy="false"><Context path="/Cafesite_OneBottle" docBase="$docBase" reloadable="false"/></Host></Engine></Service></Server>
"@ | Set-Content "$runtime\conf\server.xml" -Encoding utf8
$java=(Get-Command java.exe).Source
$argsList=@('-Dcatalina.home="'+$tomcatHome+'"','-Dcatalina.base="'+$runtime+'"','-Djava.io.tmpdir="'+$runtime+'\temp"','-Dfile.encoding=UTF-8','-classpath','"'+$tomcatHome+'\bin\bootstrap.jar;'+$tomcatHome+'\bin\tomcat-juli.jar"','org.apache.catalina.startup.Bootstrap','start')
if(Test-Path "$runtime\prototype.pid"){
 $oldId=Get-Content "$runtime\prototype.pid"
 if(Get-Process -Id $oldId -ErrorAction SilentlyContinue){ throw '프로토타입 서버가 이미 실행 중입니다. stop-prototype.ps1로 종료 후 다시 실행하세요.' }
}
$proc=Start-Process -FilePath $java -ArgumentList $argsList -WindowStyle Hidden -RedirectStandardOutput "$runtime\logs\stdout.log" -RedirectStandardError "$runtime\logs\stderr.log" -PassThru
$proc.Id | Set-Content "$runtime\prototype.pid"
Write-Output "http://localhost:$Port/Cafesite_OneBottle/"
