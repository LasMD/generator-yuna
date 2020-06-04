@echo off
setlocal EnableDelayedExpansion
goto :main

:main
    setlocal
    set _app=<%=project.name%>
    set _base=<%=deploy.base%>
    set _destination=!_base!\<%=deploy.path%>
    set _source=%~dp0build
    set /A _flag=0

    echo *********************************************
    echo    Deploying in %~1 mode: %TIME%
    echo        Deploy path: !^_destination!
    echo *********************************************

    call :check !_base!, !_app!, _flag

    if !_flag! equ 0 (
        call :setbase "D:" %~dp0 "for VSCode"
        rem code .
        call :create !_base!, !_app!
    )

    xcopy "!_source!" "!_destination!" /D /C /S /Y
    exit /b 0
    endlocal

rem @param %1 => driver path
rem @param %2 => file path
rem @return %3 => boolean for root existance 
:check 
    echo ::::: checking for local web server destination :::::
    call :setbase "C:" "%~1" "for local web server root"
    if exist %~2 (
        set /a %~3=1
    ) else (
        set /a %~3=0
    )
    exit /b 0

rem @param %1 => driver path
rem @parem %2 => server root
:setbase 
    echo ::::: setting up base %~3 :::::
    chdir /D "%~1"

    rem the base dir for app to exists=> %2
    chdir %~2 
    exit /b 0

rem @param %1 => server root
rem @parem %2 => app name
:create 
    echo ::::: creating the app root :::::
    rem setting the base to create app folder %1
    call :setbase "C:" "%~1" "for local deployment":
    mkdir %~2
    exit /b 0

endlocal