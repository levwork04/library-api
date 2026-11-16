using LibraryApi.Data;
using LibraryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryApi.Controllers;

[ApiController]
[Route("api/loans")]
public class LoansController : ControllerBase
{
    private readonly LibraryStore _store;

    public LoansController(LibraryStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Loan>> GetAll([FromQuery] bool? activeOnly)
    {
        var loans = _store.Loans
            .Where(loan => activeOnly != true || loan.IsActive())
            .Select(loan => loan)
            .ToList();

        return Ok(loans);
    }

    [HttpGet("{id:int}")]
    public ActionResult<Loan> GetById(int id) => Ok(_store.GetLoan(id));

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Loan> Create(CreateLoanRequest request)
    {
        var loan = _store.Issue(request.BookId, request.ReaderId, request.Days);
        return CreatedAtAction(nameof(GetById), new { id = loan.Id }, loan);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Loan> Extend(int id, ExtendLoanRequest request) =>
        Ok(_store.Extend(id, request.DueOn));

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/return")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Loan> Return(int id) => Ok(_store.Return(id));

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult Delete(int id)
    {
        _store.DeleteLoan(id);
        return NoContent();
    }
}
