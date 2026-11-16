namespace LibraryApi.Models;

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token, string Username, string Role, DateTime ExpiresAt);

public record CreateBookRequest(string Title, string Author, int PublishedYear, decimal Price, int TotalCopies);

public record UpdateBookRequest(string Title, string Author, int PublishedYear, decimal Price, int TotalCopies);

public record DiscountRequest(decimal Percent);

public record CreateReaderRequest(string FirstName, string LastName, string Email);

public record UpdateReaderRequest(string FirstName, string LastName, string Email);

public record CreateLoanRequest(int BookId, int ReaderId, int Days);

public record ExtendLoanRequest(DateTime DueOn);

public record ActiveLoanReport(int LoanId, string BookTitle, string Author, string ReaderName, DateTime IssuedOn, DateTime DueOn);

public record OverdueLoanReport(int LoanId, string BookTitle, string ReaderName, DateTime DueOn, int DaysOverdue, decimal Fine);

public record ReaderActivityReport(int ReaderId, string ReaderName, bool IsBlocked, int LoanCount, int ActiveLoanCount, decimal Fine);

public record BookUsageReport(int BookId, string Title, string Author, int AvailableCopies, int TotalCopies, int LoanCount, bool HasActiveLoan);
