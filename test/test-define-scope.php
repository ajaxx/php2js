<?php
// Global define - should be export const
define('GLOBAL_CONSTANT', 'global value');

function myFunction() {
    // Local define inside function - should be local const
    define('LOCAL_CONSTANT', 'local value');
    
    $result = LOCAL_CONSTANT;
    return $result;
}

// Another global define
define('ANOTHER_GLOBAL', 123);
