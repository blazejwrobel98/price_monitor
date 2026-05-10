import uvicorn

from price_monitor.config import Settings


def main() -> None:
    port = Settings().price_monitor_port
    uvicorn.run("price_monitor.main:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
    main()
