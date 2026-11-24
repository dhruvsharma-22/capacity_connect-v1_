"use client";
import { useParams } from "next/navigation";
import { PortalLayout } from "@/components/portal-layout";
import PortalPage from "@/components/portal-page";
export default function TeacherPage(){const params=useParams<{slug:string}>();return <PortalLayout><PortalPage view="teacher" slug={params.slug}/></PortalLayout>;}
