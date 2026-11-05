import React from "react";
import AdminCrud from "@/components/AdminCrud";

export default function AdminBlog() {
    return <AdminCrud config={{
        entity: "BlogPost", title: "Blog / CMS", subtitle: "Articles & website content",
        columns: [
            { key: "title", label: "Title", render: b => <span className="font-semibold text-ink">{b.title}</span> },
            { key: "category", label: "Category" },
            { key: "author", label: "Author" },
            { key: "publish_date", label: "Publish Date" },
            { key: "is_published", label: "Published", render: b => <span className={`text-xs font-bold ${b.is_published ? "text-green-600" : "text-ink-soft"}`}>{b.is_published ? "Yes" : "Draft"}</span> },
        ],
        formFields: [
            { key: "title", label: "Title", required: true },
            { key: "slug", label: "Slug" },
            { key: "category", label: "Category" },
            { key: "author", label: "Author" },
            { key: "featured_image", label: "Featured Image URL" },
            { key: "content", label: "Content", type: "textarea" },
            { key: "seo_title", label: "SEO Title" },
            { key: "seo_description", label: "SEO Description", type: "textarea" },
            { key: "publish_date", label: "Publish Date" },
            { key: "is_published", label: "Published", type: "boolean" },
        ],
        defaults: { is_published: true, author: "RK Printers" },
    }} />;
}