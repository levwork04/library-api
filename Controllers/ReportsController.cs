using LibraryApi.Data;
using LibraryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryApi.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class ReportsController : ControllerBase
{
    private readonly LibraryStore _store;

    public ReportsController(LibraryStore store)
    {
        _store = store;
    }

    [HttpGet("active-loans")]
    public ActionResult<IEnumerable<ActiveLoanReport>> ActiveLoans()
    {
        var loans = _store.Loans;
        var books = _store.Books;
        var readers = _store.Readers;

        var report = loans
            .Where(loan => loan.IsActive())
            .Join(books, loan => loan.BookId, book => book.Id, (loan, book) => new { loan, book })
            .Join(readers, row => row.loan.ReaderId, reader => reader.Id, (row, reader) => new { row.loan, row.book, reader })
            .Select(row => new ActiveLoanReport(
                row.loan.Id,
                row.book.Title,
                row.book.Author,
                row.reader.FullName(),
                row.loan.IssuedOn,
                row.loan.DueOn))
            .ToList();

        return Ok(report);
    }

    [HttpGet("overdue")]
    public ActionResult<IEnumerable<OverdueLoanReport>> Overdue()
    {
        var today = DateTime.Today;
        var loans = _store.Loans;
        var books = _store.Books;
        var readers = _store.Readers;

        var report = loans
            .Where(loan => loan.IsOverdue(today))
            .Join(books, loan => loan.BookId, book => book.Id, (loan, book) => new { loan, book })
            .Join(readers, row => row.loan.ReaderId, reader => reader.Id, (row, reader) => new { row.loan, row.book, reader })
            .Select(row => new OverdueLoanReport(
                row.loan.Id,
                row.book.Title,
                row.reader.FullName(),
                row.loan.DueOn,
                row.loan.DaysOverdue(today),
                row.loan.CalculateFine(today)))
            .ToList();

        return Ok(report);
    }

    [HttpGet("readers")]
    public ActionResult<IEnumerable<ReaderActivityReport>> Readers()
    {
        var today = DateTime.Today;
        var readers = _store.Readers;
        var loans = _store.Loans;

        var report = readers
            .Select(reader => new ReaderActivityReport(
                reader.Id,
                reader.FullName(),
                reader.IsBlocked,
                loans.Where(loan => loan.ReaderId == reader.Id).Count(),
                loans.Where(loan => loan.ReaderId == reader.Id && loan.IsActive()).Count(),
                loans.Where(loan => loan.ReaderId == reader.Id).Sum(loan => loan.CalculateFine(today))))
            .ToList();

        return Ok(report);
    }

    [HttpGet("books")]
    public ActionResult<IEnumerable<BookUsageReport>> Books()
    {
        var books = _store.Books;
        var loans = _store.Loans;

        var report = books
            .Select(book => new BookUsageReport(
                book.Id,
                book.Title,
                book.Author,
                book.AvailableCopies,
                book.TotalCopies,
                loans.Where(loan => loan.BookId == book.Id).Count(),
                loans.Where(loan => loan.BookId == book.Id).Any(loan => loan.IsActive())))
            .ToList();

        return Ok(report);
    }
}
