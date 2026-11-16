namespace LibraryApi.Models;

public class Loan
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public int ReaderId { get; set; }
    public DateTime IssuedOn { get; set; }
    public DateTime DueOn { get; set; }
    public DateTime? ReturnedOn { get; set; }
    public decimal DailyFine { get; set; }

    public static Loan Issue(Book book, Reader reader, DateTime issuedOn, int days, decimal dailyFine = 10m)
    {
        if (!reader.CanBorrow())
            throw new InvalidOperationException($"Читатель {reader.FullName()} заблокирован и не может брать книги.");
        if (days < 1 || days > 60)
            throw new ArgumentException("Срок выдачи должен быть от 1 до 60 дней.");
        if (dailyFine < 0)
            throw new ArgumentException("Ставка штрафа не может быть отрицательной.");

        book.LendCopy();

        return new Loan
        {
            BookId = book.Id,
            ReaderId = reader.Id,
            IssuedOn = issuedOn.Date,
            DueOn = issuedOn.Date.AddDays(days),
            DailyFine = dailyFine
        };
    }

    public bool IsActive() => ReturnedOn is null;

    public bool IsOverdue(DateTime on) => IsActive() && on.Date > DueOn.Date;

    public int DaysOverdue(DateTime on)
    {
        if (!IsOverdue(on))
            return 0;
        return (on.Date - DueOn.Date).Days;
    }

    public decimal CalculateFine(DateTime on) => DaysOverdue(on) * DailyFine;

    public void ExtendDue(DateTime newDue)
    {
        if (!IsActive())
            throw new InvalidOperationException("Закрытую выдачу нельзя продлить.");
        if (newDue.Date < IssuedOn.Date)
            throw new ArgumentException("Новый срок раньше даты выдачи.");
        DueOn = newDue.Date;
    }

    public void Close(DateTime on, Book book)
    {
        if (!IsActive())
            throw new InvalidOperationException("Выдача уже закрыта.");
        if (book.Id != BookId)
            throw new ArgumentException("Книга не соответствует выдаче.");
        if (on.Date < IssuedOn.Date)
            throw new ArgumentException("Дата возврата раньше даты выдачи.");

        ReturnedOn = on.Date;
        book.ReturnCopy();
    }
}
