<?php
/**
 * Block comment
 */
$format = 'test';

if ( 'html5' === $format ) {
    // The title may be filtered: Strip out HTML and make sure the aria-label is never empty.
    $title = trim( strip_tags( $title ) );
    $aria_label = $title ? $title : $default_title;
}
