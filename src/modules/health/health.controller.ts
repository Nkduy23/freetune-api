// GET /health
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  // Endpoint đơn giản để Render/uptime-check biết service còn sống.
  // Không query DB ở đây để health check không bị fail chỉ vì DB chậm/cold start.
  @Get()
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
