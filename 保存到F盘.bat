@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "SRC=%~dp0"
set "DEST=F:\shitmountain"

if not exist F:\ (
  echo 没有检测到 F 盘，请先插入或挂载 F 盘后再运行。
  pause
  exit /b 1
)

mkdir "%DEST%" 2>nul
robocopy "%SRC%." "%DEST%" /E /NFL /NDL /NJH /NJS /XD .git /XF "保存到F盘.bat"
if errorlevel 8 (
  echo 复制失败。
  pause
  exit /b 1
)

echo 已保存到 %DEST%
explorer "%DEST%"
pause
