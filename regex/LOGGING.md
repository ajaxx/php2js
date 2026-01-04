# Logging Configuration

The PHP to JavaScript converter uses **log4js** for comprehensive logging.

## Installation

Install dependencies:
```bash
npm install
```

## Log Levels

The converter supports the following log levels (from most to least verbose):

- **TRACE**: Most detailed, for deep debugging
- **DEBUG**: Detailed processing information (file-by-file, timing)
- **INFO**: General conversion progress and summary (default)
- **WARN**: Warning messages
- **ERROR**: Conversion errors and failures
- **FATAL**: Critical errors only

### Setting Log Level

Use the `--log-level` command-line option:

```bash
# Debug mode - see detailed processing
node convert.mjs --src ./php-files --dst ./js-files --log-level debug

# Quiet mode - errors only
node convert.mjs --src ./php-files --dst ./js-files --log-level error

# Default (info)
node convert.mjs --src ./php-files --dst ./js-files
```

## Log Output

Logs are written to two destinations:
1. **Console**: Real-time output during conversion
2. **File**: `php2js-conversion.log` in the current directory

## Configuration

The log4js configuration is in `convert.mjs`:

```javascript
log4js.configure({
    appenders: {
        console: { type: 'console' },
        file: { type: 'file', filename: 'php2js-conversion.log' }
    },
    categories: {
        default: { appenders: ['console', 'file'], level: 'info' }
    }
});
```

### Changing Log Level

To see more detailed output (DEBUG level), modify the configuration:

```javascript
categories: {
    default: { appenders: ['console', 'file'], level: 'debug' }
}
```

### Custom Log File Location

Change the filename in the configuration:

```javascript
file: { type: 'file', filename: '/path/to/your/logfile.log' }
```

## Log Format

### INFO Level
```
[2025-10-04 01:51:19.123] [INFO] php2js - Starting conversion... (recurse: true, stats: false)
[2025-10-04 01:51:19.456] [INFO] php2js - Source: D:\Src\WordPress\wp-login.php
[2025-10-04 01:51:19.789] [INFO] php2js - Destination: D:\src\WordPress-JS
[2025-10-04 01:51:20.123] [INFO] php2js - Converted: D:\Src\WordPress\wp-login.php -> D:\src\WordPress-JS\wp-login.js
[2025-10-04 01:51:20.456] [INFO] php2js - Conversion complete. Files processed: 1, written: 1, errors: 0
```

### DEBUG Level
```
[2025-10-04 01:51:19.123] [DEBUG] php2js - Processing: D:\Src\WordPress\wp-login.php
[2025-10-04 01:51:20.123] [DEBUG] php2js - Processing time: 234.56ms
```

### ERROR Level
```
[2025-10-04 01:51:20.123] [ERROR] php2js - Error converting D:\Src\WordPress\bad-file.php: Unexpected token
[2025-10-04 01:51:20.124] [DEBUG] php2js - Error: Unexpected token
    at transformPhpToJs (file:///D:/Src/php2js/convert.mjs:750:15)
    ...
```

## Usage with Stats

Enable detailed statistics to see processing times:

```bash
node convert.mjs --src ./php-files --dst ./js-files --stats
```

This will log:
- Individual file processing times (DEBUG level)
- Summary statistics (INFO level):
  - Total files processed
  - Average processing time
  - Min/Max processing time
  - P90 processing time

## Troubleshooting

### Log file not created
- Ensure write permissions in the current directory
- Check disk space

### Too much output
- Change log level from `debug` to `info` or `warn`
- Disable console appender for file-only logging

### Missing logs
- Logs are flushed on shutdown
- If the process crashes, some logs may be lost
- Check the log file for partial output
