using LibraryApi.Auth;
using LibraryApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace LibraryApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly TokenService _tokens;

    public AuthController(TokenService tokens)
    {
        _tokens = tokens;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<LoginResponse> Login(LoginRequest request)
    {
        var account = Accounts.Find(request.Username, request.Password);
        if (account is null)
            return Unauthorized(new { message = "Неверный логин или пароль." });

        var token = _tokens.CreateToken(account);
        return Ok(new LoginResponse(token.Token, account.Username, account.Role, token.ExpiresAt));
    }
}
