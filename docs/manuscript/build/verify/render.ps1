# Exports a .docx to PDF through Microsoft Word, so the page check sees what
# Word itself renders. Usage: render.ps1 <docx> <pdf>
param(
    [Parameter(Mandatory = $true)][string]$Docx,
    [Parameter(Mandatory = $true)][string]$Pdf
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    $doc = $word.Documents.Open((Resolve-Path $Docx).Path, $false, $true)
    # 17 = wdFormatPDF
    $doc.SaveAs2([System.IO.Path]::GetFullPath($Pdf), 17)
    $doc.Close($false)
    Write-Output "Wrote $Pdf"
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
