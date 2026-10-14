param([switch]$Verbose)

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class ChromeRefresh {
  delegate bool EnumProc(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr p);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);

  public static List<KeyValuePair<IntPtr, string>> Find(string needle) {
    var found = new List<KeyValuePair<IntPtr, string>>();
    EnumWindows(delegate (IntPtr h, IntPtr p) {
      if (!IsWindowVisible(h)) return true;
      var cls = new StringBuilder(64);
      GetClassName(h, cls, cls.Capacity);
      if (cls.ToString() != "Chrome_WidgetWin_1") return true;
      var title = new StringBuilder(512);
      GetWindowText(h, title, title.Capacity);
      var t = title.ToString();
      if (t.Contains(needle) && t.EndsWith("Google Chrome")) found.Add(new KeyValuePair<IntPtr, string>(h, t));
      return true;
    }, IntPtr.Zero);
    return found;
  }

  static void Focus(IntPtr h) {
    keybd_event(0x12, 0, 0, UIntPtr.Zero);
    keybd_event(0x12, 0, 2, UIntPtr.Zero);
    SetForegroundWindow(h);
  }

  public static bool Reload(IntPtr h) {
    if (IsIconic(h)) return false;
    Focus(h);
    System.Threading.Thread.Sleep(200);
    keybd_event(0x74, 0, 0, UIntPtr.Zero);
    keybd_event(0x74, 0, 2, UIntPtr.Zero);
    System.Threading.Thread.Sleep(150);
    return true;
  }

  public static IntPtr Foreground() { return GetForegroundWindow(); }
  public static void Restore(IntPtr h) { if (h != IntPtr.Zero) Focus(h); }
}
"@

$previous = [ChromeRefresh]::Foreground()
$windows = [ChromeRefresh]::Find('JD & JC')

foreach ($w in $windows) {
  $ok = [ChromeRefresh]::Reload($w.Key)
  if ($Verbose) { Write-Output ("{0} reloaded={1}" -f $w.Value, $ok) }
}

if ($windows.Count -gt 0) { [ChromeRefresh]::Restore($previous) }
if ($Verbose) { Write-Output ("matched windows: {0}" -f $windows.Count) }
