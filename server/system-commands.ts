import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CommandResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
}

/**
 * Opens an application on Windows
 */
export async function openApplication(appName: string): Promise<CommandResult> {
  try {
    // Common application mappings
    const appMappings: Record<string, string> = {
      'notepad': 'notepad.exe',
      'calculator': 'calc.exe',
      'paint': 'mspaint.exe',
      'word': 'winword.exe',
      'excel': 'excel.exe',
      'powerpoint': 'powerpnt.exe',
      'chrome': 'chrome.exe',
      'firefox': 'firefox.exe',
      'edge': 'msedge.exe',
      'vscode': 'code.exe',
      'visual studio code': 'code.exe',
      'spotify': 'spotify.exe',
      'discord': 'discord.exe',
      'steam': 'steam.exe',
      'photoshop': 'photoshop.exe',
      'explorer': 'explorer.exe',
      'file explorer': 'explorer.exe',
      'command prompt': 'cmd.exe',
      'cmd': 'cmd.exe',
      'powershell': 'powershell.exe',
      'task manager': 'taskmgr.exe',
      'settings': 'ms-settings:',
      'control panel': 'control.exe',
    };

    // Normalize app name
    const normalizedName = appName.toLowerCase().trim();
    const appToOpen = appMappings[normalizedName] || appName;

    console.log(`[SYSTEM] Opening application: ${appName} -> ${appToOpen}`);

    // Use Windows start command
    const command = `start "" "${appToOpen}"`;
    
    await execAsync(command, { 
      shell: 'cmd.exe',
      timeout: 5000 
    });

    return {
      success: true,
      message: `Successfully opened ${appName}`,
      output: `Application "${appName}" has been opened`
    };
  } catch (error: any) {
    console.error(`[SYSTEM] Error opening application ${appName}:`, error);
    return {
      success: false,
      message: `Failed to open ${appName}`,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Opens a website in the default browser
 */
export async function openWebsite(url: string): Promise<CommandResult> {
  try {
    // Ensure URL has protocol
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }

    console.log(`[SYSTEM] Opening website: ${fullUrl}`);

    const command = `start "" "${fullUrl}"`;
    
    await execAsync(command, { 
      shell: 'cmd.exe',
      timeout: 5000 
    });

    return {
      success: true,
      message: `Successfully opened ${fullUrl}`,
      output: `Website "${fullUrl}" has been opened in your default browser`
    };
  } catch (error: any) {
    console.error(`[SYSTEM] Error opening website ${url}:`, error);
    return {
      success: false,
      message: `Failed to open ${url}`,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Detects if a message contains a command to open an application
 */
export function detectOpenCommand(message: string): { isCommand: boolean; appName?: string; url?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Patterns for opening apps
  const openPatterns = [
    /open\s+(.+)/i,
    /launch\s+(.+)/i,
    /start\s+(.+)/i,
    /run\s+(.+)/i,
  ];

  // Patterns for opening websites
  const websitePatterns = [
    /open\s+(https?:\/\/[^\s]+)/i,
    /open\s+(www\.[^\s]+)/i,
    /go\s+to\s+(https?:\/\/[^\s]+)/i,
    /go\s+to\s+(www\.[^\s]+)/i,
    /visit\s+(https?:\/\/[^\s]+)/i,
    /visit\s+(www\.[^\s]+)/i,
  ];

  // Check for website patterns first
  for (const pattern of websitePatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      return { isCommand: true, url: match[1] };
    }
  }

  // Check for app opening patterns
  for (const pattern of openPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const appName = match[1].trim();
      // Filter out common false positives
      if (!appName.match(/^(the|a|an|this|that|it|file|folder|document|app|application)\s+/i)) {
        return { isCommand: true, appName };
      }
    }
  }

  return { isCommand: false };
}

