import type { NextRequest } from "next/server";
import {
  getPresenterSyncResponse,
  postPresenterSyncResponse,
} from "@/server/presenter-sync";

export function GET(request: NextRequest) {
  return getPresenterSyncResponse(request);
}

export function POST(request: NextRequest) {
  return postPresenterSyncResponse(request);
}
