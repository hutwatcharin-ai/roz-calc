using System.Windows;
using System.Linq;
namespace GrfDiffTool;
public partial class App : Application
{
 protected override async void OnStartup(StartupEventArgs e)
 {
  base.OnStartup(e);
  // --compare <from> <to> [--output <root>]: compare two stored snapshots, no GRF read.
  var ci = Array.FindIndex(e.Args, a => a.Equals("--compare", StringComparison.OrdinalIgnoreCase));
  if (ci >= 0 && ci + 2 < e.Args.Length)
  {
   var c = DiffRunner.Compare(Options.Parse(e.Args).OutputRoot, e.Args[ci + 1], e.Args[ci + 2]);
   Shutdown(c.Success ? 0 : 1);
   return;
  }
  if (e.Args.Contains("--run", StringComparer.OrdinalIgnoreCase))
  {
   var r = await new DiffRunner().RunAsync(Options.Parse(e.Args), CancellationToken.None);
   Shutdown(r.Success ? 0 : 1);
   return;
  }
  new MainWindow(e.Args).Show();
 }
}
