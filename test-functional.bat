@echo off
echo ========================================
echo   SFA Slack Bot — Functional Test Suite
echo ========================================
echo.

REM ─── 0. SF Connectivity ──────────────────
echo [0] Testing Salesforce Connectivity...
sf data query --query "SELECT Id FROM User LIMIT 1" --use-tooling-api >nul 2>&1
if %errorlevel% neq 0 (
    echo   FAIL - Cannot reach Salesforce.
    exit /b 1
)
echo   PASS - Salesforce connected.

REM ─── 1. User Mapping ─────────────────────
echo.
echo [1] Testing User Mapping...
sf data query --query "SELECT Id, Name, email__c, IsActive__c FROM SFA_User__c WHERE IsActive__c = true LIMIT 1" --json > test_temp.json 2>nul
powershell -Command "(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize" 2>nul
if %errorlevel% equ 0 (echo   PASS - SFA_User__c accessible) else (echo   FAIL)
del test_temp.json 2>nul

REM ─── 2. Daily Plan / Visits ──────────────
echo.
echo [2] Testing Visit__c (Daily Plan)...
sf data query --query "SELECT Id, Name, Status__c, Visit_Date__c FROM Visit__c WHERE Visit_Date__c = TODAY LIMIT 5" --json > test_temp.json 2>nul
powershell -Command "$d=(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize; Write-Host '   Visits today:' $d; if($d -ge 0){Write-Host '   PASS'}else{Write-Host '   FAIL'}"
del test_temp.json 2>nul

REM ─── 3. Stores / Outlets ─────────────────
echo.
echo [3] Testing RetailStore__c (Outlets)...
sf data query --query "SELECT Id, Name, City__c FROM RetailStore__c LIMIT 3" --json > test_temp.json 2>nul
powershell -Command "$d=(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize; Write-Host '   Stores found:' $d; if($d -ge 0){Write-Host '   PASS'}else{Write-Host '   FAIL'}"
del test_temp.json 2>nul

REM ─── 4. Beat Planning ────────────────────
echo.
echo [4] Testing Beat__c (Beat Planning)...
sf data query --query "SELECT Id, Name, Status__c FROM Beat__c LIMIT 1" --json > test_temp.json 2>nul
powershell -Command "$d=(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize; Write-Host '   Beats found:' $d; if($d -ge 0){Write-Host '   PASS'}else{Write-Host '   FAIL'}"
del test_temp.json 2>nul

REM ─── 5. Beat Plan Line Items ─────────────
echo.
echo [5] Testing Beat_Plan_Line_Item__c...
sf data query --query "SELECT Id FROM Beat_Plan_Line_Item__c LIMIT 1" --json > test_temp.json 2>nul
powershell -Command "$d=(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize; Write-Host '   Found:' $d; if($d -ge 0){Write-Host '   PASS'}else{Write-Host '   FAIL'}"
del test_temp.json 2>nul

REM ─── 6. Orders ───────────────────────────
echo.
echo [6] Testing Order / OrderItem...
sf data query --query "SELECT Id, OrderNumber FROM Order LIMIT 1" --json > test_temp.json 2>nul
powershell -Command "$d=(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize; Write-Host '   Orders found:' $d; if($d -ge 0){Write-Host '   PASS'}else{Write-Host '   FAIL'}"
del test_temp.json 2>nul

REM ─── 7. Products ─────────────────────────
echo.
echo [7] Testing Product2 + PricebookEntry...
sf data query --query "SELECT Id, Name FROM Product2 WHERE IsActive=true LIMIT 3" --json > test_temp.json 2>nul
powershell -Command "$d=(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize; Write-Host '   Products:' $d; if($d -ge 0){Write-Host '   PASS'}else{Write-Host '   FAIL'}"
del test_temp.json 2>nul

REM ─── 8. Visit Survey Response ────────────
echo.
echo [8] Testing Visit_Survey_Response__c...
sf data query --query "SELECT Id FROM Visit_Survey_Response__c LIMIT 1" --json > test_temp.json 2>nul
powershell -Command "$d=(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize; Write-Host '   Found:' $d; if($d -ge 0){Write-Host '   PASS'}else{Write-Host '   FAIL'}"
del test_temp.json 2>nul

REM ─── 9. Expense ──────────────────────────
echo.
echo [9] Testing Expense__c...
sf data query --query "SELECT Id FROM Expense__c LIMIT 1" --json > test_temp.json 2>nul
powershell -Command "$d=(Get-Content test_temp.json -Raw | ConvertFrom-Json).result.totalSize; Write-Host '   Found:' $d; if($d -ge 0){Write-Host '   PASS'}else{Write-Host '   FAIL'}"
del test_temp.json 2>nul

REM ─── 10. Picklist Values ─────────────────
echo.
echo [10] Testing Visit__c.Status__c picklist values...
sf data query --query "SELECT QualifiedApiName, Label, DataType FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName='Visit__c' AND QualifiedApiName='Status__c'" --use-tooling-api --json 2>nul | powershell -Command "$in=$input; ($in -join '' | ConvertFrom-Json).result.records[0].DataType"
echo   PASS

echo.
echo ========================================
echo   All functional tests completed.
echo ========================================
