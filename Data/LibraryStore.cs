using LibraryApi.Models;

namespace LibraryApi.Data;

public class LibraryStore
{
    private readonly object _gate = new();
    private readonly List<Book> _books = [];
    private readonly List<Reader> _readers = [];
    private readonly List<Loan> _loans = [];
    private int _nextBookId = 1;
    private int _nextReaderId = 1;
    private int _nextLoanId = 1;

    public LibraryStore()
    {
        Seed();
    }

    public IReadOnlyList<Book> Books
    {
        get { lock (_gate) return _books.ToList(); }
    }

    public IReadOnlyList<Reader> Readers
    {
        get { lock (_gate) return _readers.ToList(); }
    }

    public IReadOnlyList<Loan> Loans
    {
        get { lock (_gate) return _loans.ToList(); }
    }

    public Book GetBook(int id)
    {
        lock (_gate) return FindBook(id);
    }

    public Book AddBook(string title, string author, int publishedYear, decimal price, int totalCopies)
    {
        lock (_gate)
        {
            var book = Book.Create(title, author, publishedYear, price, totalCopies);
            book.Id = _nextBookId++;
            _books.Add(book);
            return book;
        }
    }

    public Book UpdateBook(int id, string title, string author, int publishedYear, decimal price, int totalCopies)
    {
        lock (_gate)
        {
            var book = FindBook(id);
            book.UpdateCatalog(title, author, publishedYear, price, totalCopies);
            return book;
        }
    }

    public Book ApplyDiscount(int id, decimal percent)
    {
        lock (_gate)
        {
            var book = FindBook(id);
            book.ApplyDiscount(percent);
            return book;
        }
    }

    public void DeleteBook(int id)
    {
        lock (_gate)
        {
            var book = FindBook(id);
            if (_loans.Any(loan => loan.BookId == id))
                throw new InvalidOperationException("Нельзя удалить книгу, по которой есть выдачи.");
            _books.Remove(book);
        }
    }

    public Reader GetReader(int id)
    {
        lock (_gate) return FindReader(id);
    }

    public Reader AddReader(string firstName, string lastName, string email)
    {
        lock (_gate)
        {
            var reader = Reader.Create(firstName, lastName, email);
            reader.Id = _nextReaderId++;
            _readers.Add(reader);
            return reader;
        }
    }

    public Reader UpdateReader(int id, string firstName, string lastName, string email)
    {
        lock (_gate)
        {
            var reader = FindReader(id);
            reader.UpdateContact(firstName, lastName, email);
            return reader;
        }
    }

    public Reader BlockReader(int id)
    {
        lock (_gate)
        {
            var reader = FindReader(id);
            reader.Block();
            return reader;
        }
    }

    public Reader UnblockReader(int id)
    {
        lock (_gate)
        {
            var reader = FindReader(id);
            reader.Unblock();
            return reader;
        }
    }

    public void DeleteReader(int id)
    {
        lock (_gate)
        {
            var reader = FindReader(id);
            if (_loans.Any(loan => loan.ReaderId == id && loan.IsActive()))
                throw new InvalidOperationException("Нельзя удалить читателя с открытыми выдачами.");
            _readers.Remove(reader);
        }
    }

    public Loan GetLoan(int id)
    {
        lock (_gate) return FindLoan(id);
    }

    public Loan Issue(int bookId, int readerId, int days)
    {
        lock (_gate)
        {
            var book = FindBook(bookId);
            var reader = FindReader(readerId);
            var loan = Loan.Issue(book, reader, DateTime.Today, days);
            loan.Id = _nextLoanId++;
            _loans.Add(loan);
            return loan;
        }
    }

    public Loan Extend(int id, DateTime dueOn)
    {
        lock (_gate)
        {
            var loan = FindLoan(id);
            loan.ExtendDue(dueOn);
            return loan;
        }
    }

    public Loan Return(int id)
    {
        lock (_gate)
        {
            var loan = FindLoan(id);
            loan.Close(DateTime.Today, FindBook(loan.BookId));
            return loan;
        }
    }

    public void DeleteLoan(int id)
    {
        lock (_gate)
        {
            var loan = FindLoan(id);
            if (loan.IsActive())
                loan.Close(DateTime.Today, FindBook(loan.BookId));
            _loans.Remove(loan);
        }
    }

    private Book FindBook(int id) =>
        _books.FirstOrDefault(book => book.Id == id) ?? throw new KeyNotFoundException($"Книга {id} не найдена.");

    private Reader FindReader(int id) =>
        _readers.FirstOrDefault(reader => reader.Id == id) ?? throw new KeyNotFoundException($"Читатель {id} не найден.");

    private Loan FindLoan(int id) =>
        _loans.FirstOrDefault(loan => loan.Id == id) ?? throw new KeyNotFoundException($"Выдача {id} не найдена.");

    private void Seed()
    {
        var master = Book.Create("Мастер и Маргарита", "Булгаков", 1967, 450m, 3);
        var crime = Book.Create("Преступление и наказание", "Достоевский", 1866, 390m, 2);
        var war = Book.Create("Война и мир", "Толстой", 1869, 700m, 1);
        foreach (var book in new[] { master, crime, war })
        {
            book.Id = _nextBookId++;
            _books.Add(book);
        }

        var anna = Reader.Create("Анна", "Иванова", "anna@example.com");
        var petr = Reader.Create("Пётр", "Сидоров", "petr@example.com");
        var maria = Reader.Create("Мария", "Кузнецова", "maria@example.com");
        petr.Block();
        foreach (var reader in new[] { anna, petr, maria })
        {
            reader.Id = _nextReaderId++;
            _readers.Add(reader);
        }

        var active = Loan.Issue(master, anna, DateTime.Today.AddDays(-3), 10);
        active.Id = _nextLoanId++;
        var overdue = Loan.Issue(war, maria, DateTime.Today.AddDays(-20), 10);
        overdue.Id = _nextLoanId++;
        var closed = Loan.Issue(crime, anna, DateTime.Today.AddDays(-40), 14);
        closed.Close(DateTime.Today.AddDays(-20), crime);
        closed.Id = _nextLoanId++;
        _loans.Add(active);
        _loans.Add(overdue);
        _loans.Add(closed);
    }
}
