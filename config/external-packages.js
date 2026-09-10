// 네이티브 모듈 및 외부 호출 라이브러리
const external = [
  'electron',
  'electron-updater',
  'electron-progressbar',
  'ffi-napi',
  'serialport', 
  'node-thermal-printer',
  'node-port-scanner',
  'koffi',
  'canvas',
  'node-forge',
  'xml-crypto',
  'amqp-connection-manager',
  'amqplib',
];

// Node.js 순수 내장 모듈
const builtins = [
  'assert', 'async_hooks', 'child_process', 'cluster', 'console', 
  'constants', 'crypto', 'dgram', 'dns', 'domain', 'events', 
  'fs', 'http', 'http2', 'https', 'inspector', 'module', 'net', 
  'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring', 
  'readline', 'repl', 'stream', 'timers', 'tls', 'trace_events', 
  'tty', 'url', 'util', 'v8', 'vm', 'zlib',
];

module.exports = {
  external,
  builtins,
  default: [...builtins, ...external],
};
