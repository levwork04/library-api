using LibraryApi.Data;
using LibraryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryApi.Controllers;

[ApiController]
[Route("api/readers")]
public class ReadersController : ControllerBase
{
    private readonly LibraryStore _store;

    public ReadersController(LibraryStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Reader>> GetAll([FromQuery] string? lastName)
    {
        var readers = _store.Readers
            .Where(reader => string.IsNullOrWhiteSpace(lastName)
                || reader.LastName.Contains(lastName, StringComparison.OrdinalIgnoreCase))
            .Select(reader => reader)
            .ToList();

        return Ok(readers);
    }

    [HttpGet("{id:int}")]
    public ActionResult<Reader> GetById(int id) => Ok(_store.GetReader(id));

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Reader> Create(CreateReaderRequest request)
    {
        var reader = _store.AddReader(request.FirstName, request.LastName, request.Email);
        return CreatedAtAction(nameof(GetById), new { id = reader.Id }, reader);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Reader> Update(int id, UpdateReaderRequest request) =>
        Ok(_store.UpdateReader(id, request.FirstName, request.LastName, request.Email));

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/block")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Reader> Block(int id) => Ok(_store.BlockReader(id));

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/unblock")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Reader> Unblock(int id) => Ok(_store.UnblockReader(id));

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult Delete(int id)
    {
        _store.DeleteReader(id);
        return NoContent();
    }
}
