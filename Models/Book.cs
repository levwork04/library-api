namespace LibraryApi.Models;

public class Book
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Author { get; set; } = "";
    public int PublishedYear { get; set; }
    public decimal Price { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }

    public static Book Create(string title, string author, int publishedYear, decimal price, int totalCopies)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Название обязательно.");
        if (string.IsNullOrWhiteSpace(author))
            throw new ArgumentException("Автор обязателен.");
        if (publishedYear < 1400 || publishedYear > DateTime.Today.Year + 1)
            throw new ArgumentException("Некорректный год издания.");
        if (price < 0)
            throw new ArgumentException("Цена не может быть отрицательной.");
        if (totalCopies < 1)
            throw new ArgumentException("Тираж должен быть больше нуля.");

        return new Book
        {
            Title = title.Trim(),
            Author = author.Trim(),
            PublishedYear = publishedYear,
            Price = decimal.Round(price, 2),
            TotalCopies = totalCopies,
            AvailableCopies = totalCopies
        };
    }

    public bool CanLend() => AvailableCopies > 0;

    public void LendCopy()
    {
        if (!CanLend())
            throw new InvalidOperationException($"Нет свободных экземпляров книги «{Title}».");
        AvailableCopies--;
    }

    public void ReturnCopy()
    {
        if (AvailableCopies >= TotalCopies)
            throw new InvalidOperationException($"Все экземпляры «{Title}» уже в библиотеке.");
        AvailableCopies++;
    }

    public void ApplyDiscount(decimal percent)
    {
        if (percent <= 0 || percent >= 100)
            throw new ArgumentOutOfRangeException(nameof(percent), "Скидка должна быть больше 0 и меньше 100 процентов.");
        Price = decimal.Round(Price * (1 - percent / 100m), 2, MidpointRounding.AwayFromZero);
    }

    public void UpdateCatalog(string title, string author, int publishedYear, decimal price, int totalCopies)
    {
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(author))
            throw new ArgumentException("Название и автор обязательны.");
        if (publishedYear < 1400 || publishedYear > DateTime.Today.Year + 1)
            throw new ArgumentException("Некорректный год издания.");
        if (price < 0)
            throw new ArgumentException("Цена не может быть отрицательной.");

        var onLoan = TotalCopies - AvailableCopies;
        if (totalCopies < onLoan)
            throw new InvalidOperationException("Тираж не может быть меньше числа выданных экземпляров.");

        Title = title.Trim();
        Author = author.Trim();
        PublishedYear = publishedYear;
        Price = decimal.Round(price, 2);
        TotalCopies = totalCopies;
        AvailableCopies = totalCopies - onLoan;
    }
}
