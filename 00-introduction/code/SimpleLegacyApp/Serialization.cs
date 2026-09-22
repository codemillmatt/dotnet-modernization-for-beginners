using System.IO;
using System.Runtime.Serialization.Formatters.Binary;

namespace SimpleLegacyApp
{
    /// <summary>
    /// Legacy serialization helpers that use BinaryFormatter.
    /// BinaryFormatter is deprecated and removed in modern .NET due to
    /// well-known deserialization-of-untrusted-data security risks.
    /// Review the assessment's proposed replacement and its behavior.
    /// </summary>
    public static class Serialization
    {
        /// <summary>
        /// Serialize <paramref name="value"/> to a binary buffer.
        /// </summary>
        public static byte[] Serialize<T>(T value)
        {
            using (var stream = new MemoryStream())
            {
                // BinaryFormatter is obsolete in .NET 5+ and removed in newer releases.
                // Replacement: System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(value)
                var formatter = new BinaryFormatter();
                formatter.Serialize(stream, value);
                return stream.ToArray();
            }
        }

        /// <summary>
        /// Deserialize a binary buffer back into an instance of <typeparamref name="T"/>.
        /// </summary>
        public static T Deserialize<T>(byte[] data)
        {
            using (var stream = new MemoryStream(data))
            {
                // BinaryFormatter.Deserialize is the dangerous one — it can execute
                // arbitrary code if the payload comes from an untrusted source.
                // Replacement: System.Text.Json.JsonSerializer.Deserialize<T>(data)
                //
                var formatter = new BinaryFormatter();
                return (T)formatter.Deserialize(stream);
            }
        }
    }
}
