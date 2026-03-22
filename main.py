from fastapi import FastAPI, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from model import Game, Player

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# -------------------------
# Global Game State (simple demo)
# -------------------------
game = None

# -------------------------
# Home Page
# -------------------------
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# -------------------------
# Start Game
# -------------------------
@app.post("/start/", response_class=HTMLResponse)
def start_game(request: Request, player_name: str = Form(...)):
    global game
    # Example: Human + 2 AI players
    game = Game([player_name, "AI_1", "AI_2"])
    return templates.TemplateResponse("game.html", {"request": request, "player_name": player_name, "game": game})