import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Trash2, Plus, X } from 'lucide-react';

const BatchFileRenamer = () => {
  const [files, setFiles] = useState([]);
  const [pattern, setPattern] = useState('');
  const [replacement, setReplacement] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseConversion, setCaseConversion] = useState('none');
  const [counterStart, setCounterStart] = useState(1);
  const [counterPadding, setCounterPadding] = useState(3);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [rules, setRules] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...uploadedFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addRule = () => {
    if (!pattern) {
      setError('Please enter a pattern');
      return;
    }
    setRules(prev => [...prev, {
      id: Date.now(),
      pattern,
      replacement,
      useRegex,
      caseConversion
    }]);
    setPattern('');
    setReplacement('');
  };

  const removeRule = (id) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  };

  const applyRenaming = (filename, fileIndex) => {
    let newName = filename;
    const ext = filename.lastIndexOf('.') > 0 ? filename.substring(filename.lastIndexOf('.')) : '';
    let nameWithoutExt = ext ? filename.substring(0, filename.lastIndexOf('.')) : filename;

    // Apply all rules in sequence
    rules.forEach(rule => {
      try {
        let replacementText = rule.replacement;
        
        // Handle counter placeholder
        const counterValue = counterStart + fileIndex;
        const paddedCounter = String(counterValue).padStart(counterPadding, '0');
        replacementText = replacementText.replace(/\{counter\}/g, paddedCounter);
        replacementText = replacementText.replace(/\{index\}/g, String(fileIndex + 1));
        
        // Handle date placeholders
        const now = new Date();
        replacementText = replacementText.replace(/\{date\}/g, now.toISOString().split('T')[0]);
        replacementText = replacementText.replace(/\{time\}/g, now.toTimeString().split(' ')[0].replace(/:/g, '-'));

        if (rule.useRegex) {
          const regex = new RegExp(rule.pattern, 'g');
          nameWithoutExt = nameWithoutExt.replace(regex, replacementText);
        } else {
          nameWithoutExt = nameWithoutExt.split(rule.pattern).join(replacementText);
        }

        // Apply case conversion
        switch (rule.caseConversion) {
          case 'upper':
            nameWithoutExt = nameWithoutExt.toUpperCase();
            break;
          case 'lower':
            nameWithoutExt = nameWithoutExt.toLowerCase();
            break;
          case 'title':
            nameWithoutExt = nameWithoutExt.replace(/\w\S*/g, txt => 
              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
            break;
          case 'camel':
            nameWithoutExt = nameWithoutExt.replace(/[-_\s]+(.)?/g, (_, c) => 
              c ? c.toUpperCase() : ''
            );
            break;
        }
      } catch (err) {
        throw new Error(`Error in rule: ${err.message}`);
      }
    });

    newName = nameWithoutExt + ext;
    return newName;
  };

  const generatePreview = () => {
    if (files.length === 0) {
      setError('Please upload files first');
      return;
    }

    if (rules.length === 0) {
      setError('Please add at least one renaming rule');
      return;
    }

    try {
      const newPreviews = files.map((file, index) => {
        const newName = applyRenaming(file.name, index);
        return {
          original: file.name,
          new: newName,
          changed: file.name !== newName
        };
      });
      setPreviews(newPreviews);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadRenamingScript = () => {
    if (previews.length === 0) {
      setError('Generate preview first');
      return;
    }

    const bashScript = `#!/bin/bash
# Batch File Renaming Script
# Generated on ${new Date().toISOString()}

echo "Starting batch file renaming..."

${previews.map(p => 
  p.changed ? `mv "${p.original}" "${p.new}" && echo "Renamed: ${p.original} -> ${p.new}"` : `# Skipped (no change): ${p.original}`
).join('\n')}

echo "Renaming complete!"
`;

    const windowsScript = `@echo off
REM Batch File Renaming Script
REM Generated on ${new Date().toISOString()}

echo Starting batch file renaming...

${previews.map(p => 
  p.changed ? `ren "${p.original}" "${p.new}" && echo Renamed: ${p.original} -^> ${p.new}` : `REM Skipped (no change): ${p.original}`
).join('\n')}

echo Renaming complete!
pause
`;

    const blob = new Blob([bashScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rename_files.sh';
    a.click();

    const blob2 = new Blob([windowsScript], { type: 'text/plain' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = 'rename_files.bat';
    a2.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            Advanced Batch File Renamer
          </h1>
          <p className="text-gray-600 mb-6">Powerful file renaming with regex, counters, and case conversion</p>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Files
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Upload size={20} />
                Select Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              {files.length > 0 && (
                <button
                  onClick={() => { setFiles([]); setPreviews([]); }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={20} />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
              <h3 className="font-semibold text-gray-700 mb-2">Uploaded Files ({files.length})</h3>
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <FileText size={16} />
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Renaming Rules */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-4">Add Renaming Rule</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pattern {useRegex && '(Regex)'}
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder={useRegex ? "e.g., \\d+" : "e.g., old_name"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Replacement
                </label>
                <input
                  type="text"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  placeholder="e.g., new_name_{counter}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Conversion
                </label>
                <select
                  value={caseConversion}
                  onChange={(e) => setCaseConversion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="upper">UPPERCASE</option>
                  <option value="lower">lowercase</option>
                  <option value="title">Title Case</option>
                  <option value="camel">camelCase</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRegex}
                    onChange={(e) => setUseRegex(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Use Regex</span>
                </label>
              </div>
            </div>

            <button
              onClick={addRule}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus size={20} />
              Add Rule
            </button>
          </div>

          {/* Active Rules */}
          {rules.length > 0 && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">Active Rules ({rules.length})</h3>
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div key={rule.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Rule {index + 1}: </span>
                      <span className="text-sm text-gray-600">
                        "{rule.pattern}" → "{rule.replacement}"
                        {rule.useRegex && <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">REGEX</span>}
                        {rule.caseConversion !== 'none' && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {rule.caseConversion}
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Counter Settings */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Counter Start
              </label>
              <input
                type="number"
                value={counterStart}
                onChange={(e) => setCounterStart(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Counter Padding (digits)
              </label>
              <input
                type="number"
                value={counterPadding}
                onChange={(e) => setCounterPadding(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={generatePreview}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold"
            >
              <CheckCircle size={20} />
              Generate Preview
            </button>

            {previews.length > 0 && (
              <button
                onClick={downloadRenamingScript}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                <Download size={20} />
                Download Scripts
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Preview */}
          {previews.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Preview ({previews.length} files)</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {previews.map((preview, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      {preview.changed ? (
                        <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                      ) : (
                        <AlertCircle className="text-gray-400 flex-shrink-0" size={18} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 truncate">{preview.original}</div>
                        <div className={`text-sm font-medium truncate ${preview.changed ? 'text-green-600' : 'text-gray-400'}`}>
                          → {preview.new}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Placeholders:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><code className="bg-blue-100 px-2 py-1 rounded">{'{counter}'}</code> - Sequential number with padding</div>
              <div><code className="bg-blue-100 px-2 py-1 rounded">{'{index}'}</code> - File index (1-based)</div>
              <div><code className="bg-blue-100 px-2 py-1 rounded">{'{date}'}</code> - Current date (YYYY-MM-DD)</div>
              <div><code className="bg-blue-100 px-2 py-1 rounded">{'{time}'}</code> - Current time (HH-MM-SS)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchFileRenamer;