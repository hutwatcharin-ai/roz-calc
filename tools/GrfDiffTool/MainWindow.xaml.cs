using System.Diagnostics;
using System.Windows;
using Microsoft.Win32;

namespace GrfDiffTool;

public partial class MainWindow : Window
{
    readonly Stopwatch timer = new();
    public MainWindow(string[] args) { InitializeComponent(); if (args.Length > 0) { var o = Options.Parse(args); GrfPath.Text = o.GrfPath; OutputPath.Text = o.OutputRoot; } }
    void BrowseGrf_Click(object s, RoutedEventArgs e) { var d = new OpenFileDialog { Filter = "GRF files (*.grf)|*.grf|All files (*.*)|*.*" }; if (d.ShowDialog() == true) GrfPath.Text = d.FileName; }
    void BrowseOutput_Click(object s, RoutedEventArgs e) { var d = new OpenFolderDialog(); if (d.ShowDialog() == true) OutputPath.Text = d.FolderName; }
    async void Run_Click(object s, RoutedEventArgs e)
    {
        RunButton.IsEnabled = false; TaskButton.IsEnabled = false; Progress.Value = 0; Log.Clear(); timer.Restart(); Status.Text = "Running"; ProgressText.Text = "Starting..."; ProgressCount.Text = "";
        try
        {
            var runner = new DiffRunner();
            IProgress<DiffProgress> progress = new Progress<DiffProgress>(p => { ProgressText.Text = p.Stage; ProgressCount.Text = p.Total > 0 ? $"{p.Current:N0} / {p.Total:N0} ({(double)p.Current / p.Total:P0})" : "Working..."; Progress.Value = p.Total > 0 ? p.Current * 100.0 / p.Total : 0; });
            var r = await runner.RunAsync(new Options { GrfPath = GrfPath.Text.Trim(), OutputRoot = OutputPath.Text.Trim() }, CancellationToken.None, line => Dispatcher.Invoke(() => Log.AppendText(line + Environment.NewLine)), p => Dispatcher.Invoke(() => progress.Report(p)));
            timer.Stop(); Status.Text = r.Success ? $"Done: +{r.Added} ~{r.Changed} -{r.Removed}" : "Failed"; ProgressText.Text = r.Success ? "Completed" : (r.Error ?? "Failed"); ProgressCount.Text = timer.Elapsed.ToString(@"hh\:mm\:ss"); if (r.ReportPath != null) Log.AppendText($"Report: {r.ReportPath}{Environment.NewLine}");
        }
        catch (Exception ex) { timer.Stop(); Status.Text = "Failed"; ProgressText.Text = ex.Message; Log.AppendText(ex + Environment.NewLine); }
        finally { Progress.Value = Status.Text == "Failed" ? Progress.Value : 100; RunButton.IsEnabled = true; TaskButton.IsEnabled = true; }
    }
    void Task_Click(object s, RoutedEventArgs e) { var exe = Environment.ProcessPath!; var t = new ProcessStartInfo("schtasks.exe") { UseShellExecute = false, CreateNoWindow = true }; foreach (var a in new[] { "/Create", "/F", "/SC", "WEEKLY", "/D", "SUN", "/TN", "ROZero GRF Weekly Diff", "/TR", $"\"{exe}\" --run --grf \"{GrfPath.Text}\" --output \"{OutputPath.Text}\"", "/ST", "03:00" }) t.ArgumentList.Add(a); using var p = Process.Start(t)!; p.WaitForExit(); MessageBox.Show(p.ExitCode == 0 ? "Weekly task created for Sunday 03:00." : "Could not create task. Run the app as administrator."); }
}
