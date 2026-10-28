#!/usr/bin/env sh
# Prints the shared <head> and opening <body>/<main> for a page.
# Usage: page_head.sh BASE PAGE "EN title" "TH title" "EN description"
B="$1"; PAGE="$2"; TEN="$3"; TTH="$4"; DESC="$5"
cat <<HTML
<!doctype html>
<html lang="en" class="no-js" data-theme="light" data-theme-pref="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$TEN</title>
  <meta name="description" content="$DESC">
  <meta name="theme-color" content="#f6f7fd">
  <meta name="color-scheme" content="light dark">
  <meta property="og:type" content="website">
  <meta property="og:title" content="$TEN">
  <meta property="og:description" content="$DESC">
  <meta property="og:image" content="${B}assets/images/brand/og-image.png">
  <link rel="icon" href="${B}assets/images/brand/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="icon" href="${B}assets/images/brand/favicon-192.png" sizes="192x192" type="image/png">
  <link rel="apple-touch-icon" href="${B}assets/images/brand/apple-touch-icon.png">
  <script src="${B}assets/js/prefs.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Michroma&family=Noto+Sans+Thai:wght@400;500;600&family=Prompt:wght@500;600&family=Sora:wght@500;600&display=swap">
  <link rel="stylesheet" href="${B}assets/css/main.css">
</head>
<body class="page-$PAGE" data-base="$B" data-page="$PAGE" data-title-en="$TEN" data-title-th="$TTH">

<main id="main">
HTML
