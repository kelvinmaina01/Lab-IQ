return (
  <Link key={item.path} to={item.path} className="flex-1">
    <div className="flex flex-col items-center justify-center gap-1 py-2">
      <Icon
        className={cn(
          "w-5 h-5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className={cn(
        "text-xs font-medium transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {item.label}
      </span>
    </div>
  </Link>
);
  })}
</nav >
    </div >
  );
};

export default MobileNav;