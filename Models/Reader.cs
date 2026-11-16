namespace LibraryApi.Models;

public class Reader
{
    public int Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public DateTime RegisteredOn { get; set; }
    public bool IsBlocked { get; set; }

    public static Reader Create(string firstName, string lastName, string email)
    {
        var reader = new Reader { RegisteredOn = DateTime.Today };
        reader.UpdateContact(firstName, lastName, email);
        return reader;
    }

    public string FullName() => $"{LastName} {FirstName}".Trim();

    public bool CanBorrow() => !IsBlocked;

    public void Block()
    {
        if (IsBlocked)
            throw new InvalidOperationException($"Читатель {FullName()} уже заблокирован.");
        IsBlocked = true;
    }

    public void Unblock()
    {
        if (!IsBlocked)
            throw new InvalidOperationException($"Читатель {FullName()} не заблокирован.");
        IsBlocked = false;
    }

    public void UpdateContact(string firstName, string lastName, string email)
    {
        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("Имя и фамилия обязательны.");
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new ArgumentException("Некорректный email.");

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Email = email.Trim();
    }
}
