using LibraryApi.Data;
using LibraryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryApi.Controllers;

[ApiController]
[Route("api/books")]
public class BooksController : ControllerBase
{
    private readonly LibraryStore _store;

    public BooksController(LibraryStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Book>> GetAll([FromQuery] string? author, [FromQuery] bool? available)
    {
        var books = _store.Books
            .Where(book => string.IsNullOrWhiteSpace(author)
                || book.Author.Contains(author, StringComparison.OrdinalIgnoreCase))
            .Where(book => available != true || book.CanLend())
            .Select(book => book)
            .ToList();

        return Ok(books);
    }

    [HttpGet("{id:int}")]
    public ActionResult<Book> GetById(int id) => Ok(_store.GetBook(id));

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Book> Create(CreateBookRequest request)
    {
        var book = _store.AddBook(request.Title, request.Author, request.PublishedYear, request.Price, request.TotalCopies);
        return CreatedAtAction(nameof(GetById), new { id = book.Id }, book);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Book> Update(int id, UpdateBookRequest request) =>
        Ok(_store.UpdateBook(id, request.Title, request.Author, request.PublishedYear, request.Price, request.TotalCopies));

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/discount")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Book> Discount(int id, DiscountRequest request) =>
        Ok(_store.ApplyDiscount(id, request.Percent));

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult Delete(int id)
    {
        _store.DeleteBook(id);
        return NoContent();
    }
}
