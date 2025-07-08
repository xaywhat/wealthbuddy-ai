@echo off
echo Generating Android Release Keystore for WealthBuddy
echo.

set KEYSTORE_NAME=wealthbuddy-release-key.keystore
set KEY_ALIAS=wealthbuddy-key-alias

echo This will create a keystore file for signing your release APK.
echo Please provide the following information:
echo.

set /p STORE_PASSWORD=Enter keystore password (remember this!): 
set /p KEY_PASSWORD=Enter key password (can be same as keystore): 
set /p FIRST_LAST_NAME=Enter your first and last name: 
set /p ORG_UNIT=Enter your organizational unit (e.g., IT Department): 
set /p ORG_NAME=Enter your organization name (e.g., Your Company): 
set /p CITY=Enter your city: 
set /p STATE=Enter your state/province: 
set /p COUNTRY=Enter your country code (e.g., DK for Denmark): 

echo.
echo Generating keystore...

keytool -genkeypair -v -keystore android\%KEYSTORE_NAME% -alias %KEY_ALIAS% -keyalg RSA -keysize 2048 -validity 10000 -storepass %STORE_PASSWORD% -keypass %KEY_PASSWORD% -dname "CN=%FIRST_LAST_NAME%, OU=%ORG_UNIT%, O=%ORG_NAME%, L=%CITY%, S=%STATE%, C=%COUNTRY%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Keystore generated successfully!
    echo.
    echo Now update your android\gradle.properties file with:
    echo MYAPP_RELEASE_STORE_FILE=%KEYSTORE_NAME%
    echo MYAPP_RELEASE_KEY_ALIAS=%KEY_ALIAS%
    echo MYAPP_RELEASE_STORE_PASSWORD=%STORE_PASSWORD%
    echo MYAPP_RELEASE_KEY_PASSWORD=%KEY_PASSWORD%
    echo.
    echo ⚠️  IMPORTANT: Keep your keystore file and passwords safe!
    echo    You'll need them for all future app updates.
    echo.
) else (
    echo ❌ Failed to generate keystore. Please check your Java installation.
)

pause
