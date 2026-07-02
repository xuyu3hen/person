"use client";

import { useEffect, useState } from "react";

import type { SiteContent } from "@/lib/site-content";

type SiteContentResponse = {
  content: SiteContent;
  updatedAt: string | null;
};

type JsonEditors = {
  nav: string;
  socials: string;
  heroCarouselTexts: string;
  aboutTags: string;
  researchStats: string;
  researchMethodologyTags: string;
  researchAreas: string;
  projects: string;
  experience: string;
  awards: string;
  talks: string;
};

const inputClass =
  "rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm";
const textareaClass =
  "min-h-[160px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm font-mono leading-6";

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function buildJsonEditors(content: SiteContent): JsonEditors {
  return {
    nav: prettyJson(content.nav),
    socials: prettyJson(content.socials),
    heroCarouselTexts: prettyJson(content.hero.carouselTexts),
    aboutTags: prettyJson(content.about.tags),
    researchStats: prettyJson(content.researchSection.stats),
    researchMethodologyTags: prettyJson(content.researchSection.methodologyTags),
    researchAreas: prettyJson(content.researchAreas),
    projects: prettyJson(content.projects),
    experience: prettyJson(content.experience),
    awards: prettyJson(content.awards),
    talks: prettyJson(content.talks),
  };
}

function formatError(e: unknown) {
  return e instanceof Error ? e.message : "Unknown error";
}

function parseJsonField<T>(label: string, raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (e: unknown) {
    const reason = e instanceof Error ? e.message : "Invalid JSON";
    throw new Error(`${label} JSON 解析失败：${reason}`);
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="text-base font-semibold tracking-tight">{title}</div>
      <div className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
        {description}
      </div>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

export function SiteContentTab({ active }: { active: boolean }) {
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [jsonEditors, setJsonEditors] = useState<JsonEditors | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setStatus("正在读取站点内容...");
    try {
      const res = await fetch("/api/admin/site-content/", {
        credentials: "include",
      });
      const data = (await res.json().catch(() => null)) as
        | SiteContentResponse
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : `HTTP ${res.status}`
        );
      }
      const payload = data as SiteContentResponse;
      setDraft(payload.content);
      setJsonEditors(buildJsonEditors(payload.content));
      setUpdatedAt(payload.updatedAt);
      setStatus("站点内容已同步");
    } catch (e: unknown) {
      setStatus(`读取失败：${formatError(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!active || draft) return;
    void load();
  }, [active, draft]);

  if (!active) return null;

  if (loading && !draft) {
    return <div className="card p-6">正在加载站点内容...</div>;
  }

  if (!draft || !jsonEditors) {
    return (
      <div className="card p-6 flex flex-col gap-4">
        <div className="text-base font-semibold tracking-tight">站点内容</div>
        <div className="text-sm text-[color:var(--muted)]">
          还没有加载到站点资料。
        </div>
        <button className="button w-fit" onClick={() => void load()}>
          重试
        </button>
      </div>
    );
  }

  async function save() {
    const currentDraft = draft;
    const currentJsonEditors = jsonEditors;
    if (!currentDraft || !currentJsonEditors) {
      setStatus("站点内容尚未加载完成");
      return;
    }
    setSaving(true);
    setStatus("正在保存站点内容...");
    try {
      const next: SiteContent = {
        ...currentDraft,
        nav: parseJsonField("导航", currentJsonEditors.nav),
        socials: parseJsonField("社交链接", currentJsonEditors.socials),
        hero: {
          ...currentDraft.hero,
          carouselTexts: parseJsonField(
            "Hero 轮播文案",
            currentJsonEditors.heroCarouselTexts
          ),
        },
        about: {
          ...currentDraft.about,
          tags: parseJsonField("About 标签", currentJsonEditors.aboutTags),
        },
        researchSection: {
          ...currentDraft.researchSection,
          stats: parseJsonField("研究统计", currentJsonEditors.researchStats),
          methodologyTags: parseJsonField(
            "方法论标签",
            currentJsonEditors.researchMethodologyTags
          ),
        },
        researchAreas: parseJsonField("研究方向", currentJsonEditors.researchAreas),
        projects: parseJsonField("项目列表", currentJsonEditors.projects),
        experience: parseJsonField("履历列表", currentJsonEditors.experience),
        awards: parseJsonField("荣誉列表", currentJsonEditors.awards),
        talks: parseJsonField("报告列表", currentJsonEditors.talks),
      };

      const res = await fetch("/api/admin/site-content/", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: next }),
      });
      const data = (await res.json().catch(() => null)) as
        | SiteContentResponse
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : `HTTP ${res.status}`
        );
      }
      const payload = data as SiteContentResponse;
      setDraft(payload.content);
      setJsonEditors(buildJsonEditors(payload.content));
      setUpdatedAt(payload.updatedAt);
      setStatus("站点内容已保存");
    } catch (e: unknown) {
      setStatus(`保存失败：${formatError(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">站点内容总控</div>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
              前台首页的名称、导航、Hero、研究方向、项目、履历、联系方式和页脚统一从这里读取。
              数组类内容使用 JSON 编辑，保存后首页会直接走这份数据。
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="button" onClick={() => void load()} disabled={loading || saving}>
              重新拉取
            </button>
            <button
              className="button buttonPrimary"
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存站点内容"}
            </button>
          </div>
        </div>
        <div className="mt-4 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          {updatedAt ? `最近更新：${new Date(updatedAt).toLocaleString()}` : "最近更新：尚未写入"}
        </div>
        <div className="mt-2 text-sm text-[color:var(--muted)]">{status}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="基础资料" description="站点名称、头衔、联系方式等基础信息。">
          <Field label="站点名称">
            <input
              className={inputClass}
              value={draft.profile.name}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="站点标题">
            <input
              className={inputClass}
              value={draft.profile.title}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        profile: { ...prev.profile, title: e.target.value },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="Tagline">
            <input
              className={inputClass}
              value={draft.profile.tagline}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        profile: { ...prev.profile, tagline: e.target.value },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="站点简介">
            <textarea
              className={textareaClass}
              value={draft.profile.intro}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        profile: { ...prev.profile, intro: e.target.value },
                      }
                    : prev
                )
              }
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="邮箱">
              <input
                className={inputClass}
                value={draft.profile.email}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          profile: { ...prev.profile, email: e.target.value },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="地点">
              <input
                className={inputClass}
                value={draft.profile.location}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          profile: { ...prev.profile, location: e.target.value },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="时区">
              <input
                className={inputClass}
                value={draft.profile.timezone}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          profile: { ...prev.profile, timezone: e.target.value },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="CV 链接">
              <input
                className={inputClass}
                value={draft.profile.cvUrl}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          profile: { ...prev.profile, cvUrl: e.target.value },
                        }
                      : prev
                  )
                }
              />
            </Field>
          </div>
          <Field label="导航 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.nav}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, nav: e.target.value } : prev
                )
              }
            />
          </Field>
          <Field label="社交链接 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.socials}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, socials: e.target.value } : prev
                )
              }
            />
          </Field>
        </Panel>

        <Panel title="Hero 与 About" description="首页首屏和关于我模块的文本。">
          <Field label="Hero 描述">
            <textarea
              className={textareaClass}
              value={draft.hero.description}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? { ...prev, hero: { ...prev.hero, description: e.target.value } }
                    : prev
                )
              }
            />
          </Field>
          <Field label="Hero Badge">
            <input
              className={inputClass}
              value={draft.hero.badgeLabel}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? { ...prev, hero: { ...prev.hero, badgeLabel: e.target.value } }
                    : prev
                )
              }
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Focus 标题">
              <input
                className={inputClass}
                value={draft.hero.focus.label}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          hero: {
                            ...prev.hero,
                            focus: { ...prev.hero.focus, label: e.target.value },
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="Focus 内容">
              <input
                className={inputClass}
                value={draft.hero.focus.value}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          hero: {
                            ...prev.hero,
                            focus: { ...prev.hero.focus, value: e.target.value },
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="Mode 标题">
              <input
                className={inputClass}
                value={draft.hero.mode.label}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          hero: {
                            ...prev.hero,
                            mode: { ...prev.hero.mode, label: e.target.value },
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="Mode 内容">
              <input
                className={inputClass}
                value={draft.hero.mode.value}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          hero: {
                            ...prev.hero,
                            mode: { ...prev.hero.mode, value: e.target.value },
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="Stack 标题">
              <input
                className={inputClass}
                value={draft.hero.stack.label}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          hero: {
                            ...prev.hero,
                            stack: { ...prev.hero.stack, label: e.target.value },
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="Stack 内容">
              <input
                className={inputClass}
                value={draft.hero.stack.value}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          hero: {
                            ...prev.hero,
                            stack: { ...prev.hero.stack, value: e.target.value },
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
          </div>
          <Field label="Hero 轮播文案 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.heroCarouselTexts}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, heroCarouselTexts: e.target.value } : prev
                )
              }
            />
          </Field>
          <Field label="About 描述">
            <textarea
              className={textareaClass}
              value={draft.about.description}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? { ...prev, about: { ...prev.about, description: e.target.value } }
                    : prev
                )
              }
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="About 标签标题">
              <input
                className={inputClass}
                value={draft.about.systemLabel}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? { ...prev, about: { ...prev.about, systemLabel: e.target.value } }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="MBTI">
              <input
                className={inputClass}
                value={draft.about.mbti}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? { ...prev, about: { ...prev.about, mbti: e.target.value } }
                      : prev
                  )
                }
              />
            </Field>
          </div>
          <Field label="MBTI 副标题">
            <input
              className={inputClass}
              value={draft.about.mbtiLabel}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? { ...prev, about: { ...prev.about, mbtiLabel: e.target.value } }
                    : prev
                )
              }
            />
          </Field>
          <Field label="About 标签 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.aboutTags}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, aboutTags: e.target.value } : prev
                )
              }
            />
          </Field>
        </Panel>

        <Panel title="研究与项目" description="研究方向、统计条、方法论和项目卡片。">
          <Field label="研究模块说明">
            <textarea
              className={textareaClass}
              value={draft.researchSection.description}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        researchSection: {
                          ...prev.researchSection,
                          description: e.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="研究统计 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.researchStats}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, researchStats: e.target.value } : prev
                )
              }
            />
          </Field>
          <Field label="方法论标题">
            <input
              className={inputClass}
              value={draft.researchSection.methodologyTitle}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        researchSection: {
                          ...prev.researchSection,
                          methodologyTitle: e.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="方法论描述">
            <textarea
              className={textareaClass}
              value={draft.researchSection.methodologyDescription}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        researchSection: {
                          ...prev.researchSection,
                          methodologyDescription: e.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="方法论标签 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.researchMethodologyTags}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev
                    ? { ...prev, researchMethodologyTags: e.target.value }
                    : prev
                )
              }
            />
          </Field>
          <Field label="研究方向 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.researchAreas}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, researchAreas: e.target.value } : prev
                )
              }
            />
          </Field>
          <Field label="项目模块说明">
            <textarea
              className={textareaClass}
              value={draft.projectsSection.description}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        projectsSection: {
                          ...prev.projectsSection,
                          description: e.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="项目模块底部文案">
            <input
              className={inputClass}
              value={draft.projectsSection.ctaText}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        projectsSection: {
                          ...prev.projectsSection,
                          ctaText: e.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="项目列表 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.projects}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, projects: e.target.value } : prev
                )
              }
            />
          </Field>
        </Panel>

        <Panel title="履历、联系与页脚" description="履历时间线、荣誉、联系方式和页脚信息。">
          <Field label="履历模块说明">
            <textarea
              className={textareaClass}
              value={draft.experienceSection.description}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        experienceSection: {
                          ...prev.experienceSection,
                          description: e.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="荣誉标题">
              <input
                className={inputClass}
                value={draft.experienceSection.awardsTitle}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          experienceSection: {
                            ...prev.experienceSection,
                            awardsTitle: e.target.value,
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="报告标题">
              <input
                className={inputClass}
                value={draft.experienceSection.talksTitle}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          experienceSection: {
                            ...prev.experienceSection,
                            talksTitle: e.target.value,
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
          </div>
          <Field label="履历列表 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.experience}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, experience: e.target.value } : prev
                )
              }
            />
          </Field>
          <Field label="荣誉列表 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.awards}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, awards: e.target.value } : prev
                )
              }
            />
          </Field>
          <Field label="报告列表 JSON">
            <textarea
              className={textareaClass}
              value={jsonEditors.talks}
              onChange={(e) =>
                setJsonEditors((prev) =>
                  prev ? { ...prev, talks: e.target.value } : prev
                )
              }
            />
          </Field>
          <Field label="联系方式模块说明">
            <textarea
              className={textareaClass}
              value={draft.contactSection.description}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        contactSection: {
                          ...prev.contactSection,
                          description: e.target.value,
                        },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="页脚描述">
            <textarea
              className={textareaClass}
              value={draft.footer.description}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        footer: { ...prev.footer, description: e.target.value },
                      }
                    : prev
                )
              }
            />
          </Field>
          <Field label="页脚 Source 链接">
            <input
              className={inputClass}
              value={draft.footer.sourceUrl}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        footer: { ...prev.footer, sourceUrl: e.target.value },
                      }
                    : prev
                )
              }
            />
          </Field>
        </Panel>
      </div>
    </div>
  );
}
