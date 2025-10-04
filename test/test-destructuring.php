<?php
// Basic destructuring
list($a, $b, $c) = $array;

// With skipped elements
list($first, , $third) = $data;

// From function return
list($x, $y) = getCoordinates();

// Nested in assignment
$result = list($name, $age) = $person;
