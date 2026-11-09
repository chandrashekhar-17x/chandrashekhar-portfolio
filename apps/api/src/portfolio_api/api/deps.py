"""Reusable FastAPI dependencies.

A dependency is a function FastAPI calls for you before a route runs; its return
value is passed into the route. `Annotated[...]` aliases keep route signatures short.
"""

from typing import Annotated, cast

from fastapi import Depends, Request

from portfolio_api.core.config import Settings


def get_app_settings(request: Request) -> Settings:
    # The settings the app was built with (see main.create_app).
    return cast(Settings, request.app.state.settings)


SettingsDep = Annotated[Settings, Depends(get_app_settings)]
