const ts = require('typescript');

function compile() {
  const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) {
    console.error('Could not find a valid tsconfig.json.');
    return;
  }
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    onUnRecoverableConfigFileDiagnostic: (d) => console.error(d)
  };
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    config.config,
    parseConfigHost,
    './'
  );
  
  const program = ts.createProgram(parsedCommandLine.fileNames, parsedCommandLine.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file && diagnostic.file.fileName.includes('notification')) {
      const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      console.log(`File: ${diagnostic.file.fileName} (${line + 1},${character + 1})`);
      console.log(`Code: ${diagnostic.code}`);
      console.log(`Message: ${message}`);
      // Print the source line
      const lineText = diagnostic.file.text.split('\n')[line];
      console.log(`Source Line: ${lineText}`);
      console.log('-----------------------------');
    }
  });
}

compile();
