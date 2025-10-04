<?php
// Test different require patterns

// Simple string literal
require 'config.php';
require_once 'functions.php';

// Using __DIR__ constant
require __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/../vendor/autoload.php';

// Using constants (these will need manual handling)
require ABSPATH . WPINC . '/class-phpass.php';
require_once WP_PLUGIN_DIR . '/my-plugin/init.php';

// With parentheses
include( 'header.php' );
include_once( __DIR__ . '/footer.php' );
?>
