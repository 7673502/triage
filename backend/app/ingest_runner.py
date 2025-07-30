import asyncio
from app.tasks.ingest import start_pollers

async def main():
    await start_pollers()

    stop = asyncio.Event()
    try:
        await stop.wait()  # sleeps until cancelled
    except asyncio.CancelledError:
        pass

if __name__ == '__main__':
    asyncio.run(main())
