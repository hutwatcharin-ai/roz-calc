using System.IO;

namespace GrfDiffTool;

public sealed class Options
{
    public string GrfPath { get; set; } = @"D:\RagnarokZero\data.grf";
    public string OutputRoot { get; set; } = @"D:\Data grf roz\weekly";
    // grf-extract.mjs and grf-des.mjs (from the repo's tools folder) sit next to the exe.
    public string ExtractorScript { get; set; } = Path.Combine(AppContext.BaseDirectory, "grf-extract.mjs");
    public static Options Parse(string[] args)
    {
        var o = new Options();
        for (var i = 0; i < args.Length - 1; i++)
        {
            if (args[i].Equals("--grf", StringComparison.OrdinalIgnoreCase)) o.GrfPath = args[++i];
            else if (args[i].Equals("--output", StringComparison.OrdinalIgnoreCase)) o.OutputRoot = args[++i];
            else if (args[i].Equals("--extractor", StringComparison.OrdinalIgnoreCase)) o.ExtractorScript = args[++i];
        }
        return o;
    }
}
