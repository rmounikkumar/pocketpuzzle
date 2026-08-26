Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

$g.Clear([System.Drawing.Color]::FromArgb(255, 15, 18, 32))

function New-RoundPath([int]$x, [int]$y, [int]$w, [int]$h, [int]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function Convert-Hex([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Draw-RoundRect([int]$x, [int]$y, [int]$w, [int]$h, [int]$r, [System.Drawing.Color]$color) {
  $brush = New-Object System.Drawing.SolidBrush($color)
  $path = New-RoundPath $x $y $w $h $r
  $g.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

Draw-RoundRect 60 35 570 560 28 (Convert-Hex '#1B2036')

$values = @(
  @(2, 8, 0, 0),
  @(16, 64, 0, 0),
  @(128, 256, 512, 0),
  @(1024, 2048, 0, 0)
)

$fillMap = @{
  '2' = '#3D4668'; '4' = '#4A5580'; '8' = '#F59E0B'; '16' = '#FB923C'
  '32' = '#F87171'; '64' = '#EF4444'; '128' = '#34D399'; '256' = '#10B981'
  '512' = '#22D3EE'; '1024' = '#A78BFA'; '2048' = '#F59E0B'
}
$darkText = @('8', '16', '128', '256', '512', '2048')

$cellSize = 115
$gap = 15
$originX = 85
$originY = 60
$tileFont = New-Object System.Drawing.Font('Segoe UI', 30, [System.Drawing.FontStyle]::Bold)
$centerFmt = New-Object System.Drawing.StringFormat
$centerFmt.Alignment = [System.Drawing.StringAlignment]::Center
$centerFmt.LineAlignment = [System.Drawing.StringAlignment]::Center

for ($r = 0; $r -lt 4; $r++) {
  for ($c = 0; $c -lt 4; $c++) {
    $v = $values[$r][$c]
    $x = $originX + $c * ($cellSize + $gap)
    $y = $originY + $r * ($cellSize + $gap)
    if ($v -eq 0) {
      Draw-RoundRect $x $y $cellSize $cellSize 14 (Convert-Hex '#262C47')
    } else {
      $key = "$v"
      Draw-RoundRect $x $y $cellSize $cellSize 14 (Convert-Hex $fillMap[$key])
      $textColor = if ($darkText -contains $key) { (Convert-Hex '#1E1B4B') } else { (Convert-Hex '#FFFFFF') }
      $textBrush = New-Object System.Drawing.SolidBrush($textColor)
      $rect = New-Object System.Drawing.RectangleF($x, $y, $cellSize, $cellSize)
      $g.DrawString("$v", $tileFont, $textBrush, $rect, $centerFmt)
      $textBrush.Dispose()
    }
  }
}

$accentBrush = New-Object System.Drawing.SolidBrush(Convert-Hex '#F59E0B')
$g.FillRectangle($accentBrush, 690, 205, 130, 10)

function Get-FittedFont([string]$text, [int]$maxWidth, [int]$startSize) {
  $size = $startSize
  while ($size -gt 12) {
    $font = New-Object System.Drawing.Font('Segoe UI', $size, [System.Drawing.FontStyle]::Bold)
    if ($g.MeasureString($text, $font).Width -le $maxWidth) { return $font }
    $font.Dispose()
    $size -= 2
  }
  return New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
}

$titleText = 'ArcPuzzels'
$titleFont = Get-FittedFont $titleText 480 62
$titleBrush = New-Object System.Drawing.SolidBrush(Convert-Hex '#E8EAF6')
$g.DrawString($titleText, $titleFont, $titleBrush, 690, 235)

$subFont = New-Object System.Drawing.Font('Segoe UI', 27, [System.Drawing.FontStyle]::Regular)
$subBrush = New-Object System.Drawing.SolidBrush(Convert-Hex '#8B91B5')
$g.DrawString('Swipe. Merge. Reach 2048.', $subFont, $subBrush, 690, 350)

$freeFont = New-Object System.Drawing.Font('Segoe UI', 21, [System.Drawing.FontStyle]::Regular)
$freeBrush = New-Object System.Drawing.SolidBrush(Convert-Hex '#F59E0B')
$g.DrawString('Free to play in your browser', $freeFont, $freeBrush, 690, 420)

$outPath = Join-Path $PSScriptRoot '..\public\og-image.png'
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$subFont.Dispose()
$tileFont.Dispose()
Write-Output "Saved $outPath"
