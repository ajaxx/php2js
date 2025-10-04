<?php
// With .php extension
require_once 'config.php';

// Without extension (should assume .php and convert to .js)
require_once 'functions';

// With path and .php extension
include_once __DIR__ . '/includes/header.php';

// With path but no extension
include_once __DIR__ . '/includes/footer';
