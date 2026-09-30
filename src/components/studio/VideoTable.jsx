import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Eye, 
  Pencil, 
  Trash2, 
  Download, 
  BarChart3,
  Globe,
  Lock,
  Link as LinkIcon,
  PlaySquare
} from "lucide-react";

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const visibilityIcons = {
  public: Globe,
  private: Lock,
  unlisted: LinkIcon,
};

const statusColors = {
  done: "bg-green-500/20 text-green-400",
  processing: "bg-yellow-500/20 text-yellow-400",
  queued: "bg-blue-500/20 text-blue-400",
  failed: "bg-red-500/20 text-red-400",
};

export default function VideoTable({ 
  videos, 
  selectedIds = [], 
  onSelectChange, 
  onEdit, 
  onDelete,
  showCheckboxes = true 
}) {
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectChange?.(selectedIds.filter(i => i !== id));
    } else {
      onSelectChange?.([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === videos.length) {
      onSelectChange?.([]);
    } else {
      onSelectChange?.(videos.map(v => v.id));
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          {showCheckboxes && (
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === videos.length && videos.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
          )}
          <TableHead className="text-gray-400">Video</TableHead>
          <TableHead className="text-gray-400">Visibility</TableHead>
          <TableHead className="text-gray-400">Status</TableHead>
          <TableHead className="text-gray-400">Date</TableHead>
          <TableHead className="text-gray-400 text-right">Views</TableHead>
          <TableHead className="text-gray-400 text-right">Comments</TableHead>
          <TableHead className="text-gray-400 text-right">Likes %</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video) => {
          const VisibilityIcon = visibilityIcons[video.visibility] || Globe;
          const likeRatio = video.likes + video.dislikes > 0 
            ? Math.round((video.likes / (video.likes + video.dislikes)) * 100) 
            : 0;

          return (
            <TableRow key={video.id} className="border-white/10">
              {showCheckboxes && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(video.id)}
                    onCheckedChange={() => toggleSelect(video.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlaySquare className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-xs text-white">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Link 
                      to={createPageUrl(`Watch?v=${video.id}`)}
                      className="font-medium text-white hover:text-blue-400 line-clamp-2"
                    >
                      {video.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {video.description || "No description"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-gray-400">
                  <VisibilityIcon className="w-4 h-4" />
                  <span className="text-sm capitalize">{video.visibility}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[video.processing_status] || statusColors.done}>
                  {video.processing_status || "done"}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-400 text-sm">
                {formatDate(video.created_date)}
              </TableCell>
              <TableCell className="text-right text-white">
                {formatCount(video.views || 0)}
              </TableCell>
              <TableCell className="text-right text-white">
                {formatCount(video.comments_count || 0)}
              </TableCell>
              <TableCell className="text-right">
                <span className={likeRatio >= 90 ? "text-green-400" : likeRatio >= 70 ? "text-yellow-400" : "text-red-400"}>
                  {likeRatio}%
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl(`Watch?v=${video.id}`)} className="flex items-center gap-2 cursor-pointer">
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onEdit?.(video)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                      <Download className="w-4 h-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(video)}
                      className="flex items-center gap-2 cursor-pointer text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}