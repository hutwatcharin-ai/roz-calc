using System.Windows;
using System.Linq;
namespace GrfDiffTool;
public partial class App : Application
{
 protected override async void OnStartup(StartupEventArgs e)
 {
  base.OnStartup(e);
  if (e.Args.Contains("--run", StringComparer.OrdinalIgnoreCase))
  {
   var r = await new DiffRunner().RunAsync(Options.Parse(e.Args), CancellationToken.None);
   Shutdown(r.Success ? 0 : 1);
   return;
  }
  new MainWindow(e.Args).Show();
 }
}
