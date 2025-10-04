# PHP Operator Conversion

## Overview
The converter now handles PHP operators globally, converting them to their JavaScript equivalents.

## Conversion Order (Critical!)

The order of conversions is carefully designed to avoid conflicts:

1. **String Concatenation** (`.` and `.=`)
   - Happens FIRST while `->` is still intact
   - Converts `.` to `+` only in string contexts
   - Converts `.=` to `+=`

2. **Object Operators** (`->` and `::`)
   - Happens AFTER string concatenation
   - Converts `->` to `.` for object member access
   - Converts `::` to `.` for static member access

3. **Variable Stripping** (`$`)
   - Happens LAST after all operator conversions
   - Removes `$` prefix from variable names

## Operator Conversions

### String Concatenation
```php
$a = "Hello" . " " . "World";
$msg = "Hi";
$msg .= " there";
```
Converts to:
```javascript
a = "Hello" + " " + "World";
msg = "Hi";
msg += " there";
```

### Object Member Access
```php
$user->getName();
$user->email;
$user->profile->address;
```
Converts to:
```javascript
user.getName();
user.email;
user.profile.address;
```

### Static Member Access
```php
User::getInstance();
Config::get('key');
MyClass::CONSTANT;
```
Converts to:
```javascript
User.getInstance();
Config.get('key');
MyClass.CONSTANT;
```

### Method Chaining
```php
$result = $user->setName("John")
               ->setEmail("john@example.com")
               ->save();
```
Converts to:
```javascript
result = user.setName("John")
             .setEmail("john@example.com")
             .save();
```

## Why Order Matters

### Problem: If we convert `->` before string concatenation
```php
$obj->method() . "text"
```
Would incorrectly become:
```javascript
obj.method() . "text"  // . not converted because -> was already gone
```

### Solution: Convert string concatenation first
```php
$obj->method() . "text"
```
Step 1 (string concat): `$obj->method() + "text"`
Step 2 (object op): `$obj.method() + "text"`
Step 3 (strip $): `obj.method() + "text"` ✓

## Code Location

See `convert.mjs` lines 198-220:
1. Lines 201-210: String concatenation conversion
2. Lines 212-217: Object/static operator conversion
3. Line 220: Variable `$` stripping

## Testing

Test files:
- `test-concat.php` - String concatenation
- `test-method-calls.php` - Method calls with concatenation
- `test-object-operators.php` - Object and static operators
