using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Linq;

namespace GuessWho.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CardsController : ControllerBase
    {
        // get: api/cards/categories
        [HttpGet("categories")]
        public IActionResult GetCategories()
        {
            try
            {
                var dataFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "Data");

                if (!Directory.Exists(dataFolderPath))
                {
                    return Ok(new[] { "animals", "people" });
                }

                var categories = Directory.GetFiles(dataFolderPath, "*.json")
                    .Select(Path.GetFileNameWithoutExtension)
                    .ToList();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet]
        public IActionResult GetCards([FromQuery] string category)
        {
            if (string.IsNullOrWhiteSpace(category))
            {
                return BadRequest("Category is required.");
            }

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", $"{category.ToLower()}.json");

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound($"Category '{category}' not found.");
            }

            var jsonContent = System.IO.File.ReadAllText(filePath);
            return Content(jsonContent, "application/json");
        }
    }
}