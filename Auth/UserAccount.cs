namespace LibraryApi.Auth;

public record UserAccount(string Username, string Password, string Role);

public static class Accounts
{
    public static readonly UserAccount[] All =
    [
        new("admin", "Admin123!", "Admin"),
        new("user", "User123!", "User")
    ];

    public static UserAccount? Find(string username, string password) =>
        All.FirstOrDefault(account =>
            string.Equals(account.Username, username, StringComparison.Ordinal) &&
            account.Password == password);
}
