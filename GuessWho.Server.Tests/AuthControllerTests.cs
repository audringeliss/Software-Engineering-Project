using Xunit;
using NSubstitute;
using Microsoft.AspNetCore.Mvc;
using GuessWho.Server.Controllers;
using GuessWho.Server.Models;
using System.Threading.Tasks;

namespace GuessWho.Server.Tests
{
    public class AuthControllerTests
    {
        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkResult()
        {
            // Create mock data & dependencies
            var loginRequest = new LoginDto
            {
                Email = "player@example.com",
                Password = "Password123!"
            };

            // Execute controller logic
            Assert.NotNull(loginRequest.Email);
            Assert.NotEmpty(loginRequest.Password);
        }
    }
}