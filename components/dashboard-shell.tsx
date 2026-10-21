"use client"

import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChartLine,
  Command,
  FileText,
  Folder,
  Gauge,
  Gear,
  Sparkle,
} from "@phosphor-icons/react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const primaryLinks = [
  { label: "Overview", href: "#overview", icon: Gauge },
  { label: "Activity", href: "#activity", icon: ChartLine },
  { label: "Projects", href: "#projects", icon: Folder },
]

const resourceLinks = [
  { label: "Notes", href: "#notes", icon: FileText },
  { label: "Guides", href: "#guides", icon: BookOpen },
]

const exampleLinks = [
  { label: "Getting started", href: "#getting-started" },
  { label: "Design system", href: "#design-system" },
  { label: "Release notes", href: "#release-notes" },
]

export function DashboardShell() {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="none" className="border-r border-sidebar-border">
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-5">
            <Link href="#overview" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Sparkle weight="fill" />
              </span>
              <span className="text-sm font-semibold tracking-tight">Grain</span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-3 py-5">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {primaryLinks.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={item.label === "Overview"}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="pt-3">
              <SidebarGroupContent>
                <SidebarMenu>
                  {resourceLinks.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton render={<Link href={item.href} />}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="pt-3">
              <Accordion defaultValue={["examples"]} className="w-full">
                <AccordionItem value="examples" className="border-none">
                  <AccordionTrigger className="px-2 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60 hover:no-underline">
                    Examples
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <SidebarMenuSub className="mx-0 border-sidebar-border/70 px-0">
                      {exampleLinks.map((item) => (
                        <SidebarMenuSubItem key={item.label}>
                          <SidebarMenuSubButton render={<Link href={item.href} />}>
                            <ArrowRight />
                            <span>{item.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex items-center justify-between rounded-lg bg-sidebar-accent/60 px-3 py-2.5 text-xs text-sidebar-foreground/70">
              <span>v0.1</span>
              <ArrowUpRight />
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex min-h-svh min-w-0 flex-1 flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center border-b border-border px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Command className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Dashboard</p>
                <p className="text-xs text-muted-foreground">Workspace overview</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Gear />
              <span>Settings</span>
            </div>
          </header>
          <section className="flex flex-1 flex-col px-6 py-8 lg:px-8">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col rounded-xl border border-dashed border-border bg-muted/20 p-6 lg:p-8">
              <div className="flex min-h-52 flex-1 items-center justify-center text-center">
                <div className="max-w-sm">
                  <h1 className="text-lg font-semibold tracking-tight">Your dashboard starts here</h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose a section from the sidebar to begin shaping your workspace.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  )
}
